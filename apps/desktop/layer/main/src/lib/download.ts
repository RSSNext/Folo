import { createHash } from "node:crypto"
import { createWriteStream } from "node:fs"
import { mkdir } from "node:fs/promises"
import https from "node:https"
import os from "node:os"
import { pipeline } from "node:stream"
import { promisify } from "node:util"

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

  return new Promise<boolean>((resolve) => {
    https
      .get(url, (response) => {
        // Handle HTTP status codes properly
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
          onLog?.(`Failed to download file: ${response.statusCode} ${response.statusMessage}`)
          resolve(false)
          return
        }

        // Handle redirects (3xx status codes)
        if (response.statusCode >= 300 && response.statusCode < 400) {
          const { location } = response.headers
          if (location) {
            onLog?.(`Redirecting to: ${location}`)
            // Recursively handle redirect
            return downloadFileWithProgress({
              ...options,
              url: location,
            })
              .then(resolve)
              .catch(() => resolve(false))
          } else {
            onLog?.(`Redirect response without location header: ${response.statusCode}`)
            resolve(false)
            return
          }
        }

        const totalSize = Number.parseInt(response.headers["content-length"] || "0", 10)
        let downloadedSize = 0
        let lastProgressTime = Date.now()
        const sha256 = expectedHash ? createHash("sha256") : null

        onLog?.(
          `Starting download: ${path.basename(outputPath)} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`,
        )

        response.on("data", (chunk: Buffer) => {
          downloadedSize += chunk.length
          if (sha256) {
            sha256.update(chunk)
          }

          const now = Date.now()
          // Call progress callback every 500ms to avoid spam
          if (now - lastProgressTime > 500 || downloadedSize === totalSize) {
            const percentage = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0

            onLog?.(
              `Download progress: ${percentage.toFixed(1)}% (${(downloadedSize / 1024 / 1024).toFixed(2)}/${(totalSize / 1024 / 1024).toFixed(2)} MB)`,
            )

            // Call progress callback if provided
            if (onProgress) {
              onProgress(downloadedSize, totalSize, percentage)
            }

            lastProgressTime = now
          }
        })

        response.on("end", async () => {
          try {
            onLog?.(`Download completed: ${url}`)

            // Verify hash if provided
            if (expectedHash && sha256) {
              const hash = sha256.digest("hex")
              if (hash !== expectedHash) {
                onLog?.(`Hash verification failed. Expected: ${expectedHash}, Got: ${hash}`)
                resolve(false)
                return
              }
              onLog?.("Hash verification passed")
            }

            onLog?.(`Download completed: ${outputPath}`)

            resolve(true)
          } catch (error) {
            onLog?.(`Error during download completion: ${error}`)
            resolve(false)
          }
        })

        response.on("error", (error) => {
          onLog?.(`Download error: ${error}`)
          resolve(false)
        })

        // Create download directory and write stream
        mkdir(path.dirname(outputPath), { recursive: true })
          .then(() => {
            const writeStream = createWriteStream(outputPath)

            writeStream.on("error", (error) => {
              onLog?.(`Write stream error: ${error}`)
              resolve(false)
            })

            response.pipe(writeStream)
          })
          .catch((error) => {
            onLog?.(`Error creating download directory: ${error}`)
            resolve(false)
          })
      })
      .on("error", (error) => {
        onLog?.(`HTTPS request error: ${error}`)
        resolve(false)
      })
  })
}
