import { createHash } from "node:crypto"
import { createWriteStream } from "node:fs"
import { mkdir } from "node:fs/promises"
import { pipeline } from "node:stream"
import { promisify } from "node:util"

import ky from "ky"
import path from "pathe"

const streamPipeline = promisify(pipeline)

export interface DownloadOptions {
  url: string
  outputPath: string
  expectedHash?: string
  onProgress?: (downloadedSize: number, totalSize: number, percentage: number) => void
  onLog?: (message: string) => void
}

export async function downloadFile(url: string, dest: string) {
  const res = await fetch(url)

  // Check whether it responds successfully.
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
  }
  if (!res.body) {
    throw new Error(`Failed to get response body`)
  }
  await streamPipeline(res.body as any, createWriteStream(dest))
}

export async function downloadFileWithProgress(options: DownloadOptions): Promise<boolean> {
  const { url, outputPath, expectedHash, onProgress, onLog } = options

  try {
    // Create download directory
    await mkdir(path.dirname(outputPath), { recursive: true })

    let lastProgressTime = Date.now()
    const sha256 = expectedHash ? createHash("sha256") : null

    onLog?.(`Starting download: ${path.basename(outputPath)}`)

    // Use ky with onDownloadProgress
    const response = await ky.get(url, {
      onDownloadProgress: (progress) => {
        const now = Date.now()
        // Call progress callback every 500ms to avoid spam
        if (now - lastProgressTime > 500 || progress.percent === 1) {
          const percentage = progress.percent * 100
          const downloadedMB = (progress.transferredBytes / 1024 / 1024).toFixed(2)
          const totalMB = (progress.totalBytes / 1024 / 1024).toFixed(2)

          onLog?.(`Download progress: ${percentage.toFixed(1)}% (${downloadedMB}/${totalMB} MB)`)

          // Call progress callback if provided
          if (onProgress) {
            onProgress(progress.transferredBytes, progress.totalBytes, percentage)
          }

          lastProgressTime = now
        }
      },
    })

    if (!response.ok) {
      onLog?.(`Failed to download file: ${response.status} ${response.statusText}`)
      return false
    }

    // Get the response as array buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verify hash if provided
    if (expectedHash && sha256) {
      sha256.update(buffer)
      const hash = sha256.digest("hex")
      if (hash !== expectedHash) {
        onLog?.(`Hash verification failed. Expected: ${expectedHash}, Got: ${hash}`)
        return false
      }
      onLog?.("Hash verification passed")
    }

    // Write to file
    const writeStream = createWriteStream(outputPath)

    return new Promise<boolean>((resolve) => {
      writeStream.on("error", (error) => {
        onLog?.(`Write stream error: ${error}`)
        resolve(false)
      })

      writeStream.on("finish", () => {
        onLog?.(`Download completed: ${outputPath}`)
        resolve(true)
      })

      writeStream.end(buffer)
    })
  } catch (error) {
    onLog?.(`Download error: ${error}`)
    return false
  }
}

// async function testDownload() {
//   console.info("Testing ky onDownloadProgress implementation...")

//   const result = await downloadFileWithProgress({
//     url: "https://github.com/Innei/Follow/releases/download/desktop/v1.2.5/manifest.yml",
//     outputPath: path.resolve(os.tmpdir(), "follow-render-update", "manifest.yml"),
//     onLog(message) {
//       console.info(`[LOG] ${message}`)
//     },
//   })

//   console.info(`Download result: ${result}`)
// }

// testDownload().catch(console.error)
