import { Decompress } from "fzstd"
import tar from "tar-stream"

import type { OtaPlatform, OtaRelease } from "./schema"

const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]

type PlatformPayload = NonNullable<OtaRelease["platforms"][OtaPlatform]>
type PlatformAsset = PlatformPayload["launchAsset"] | PlatformPayload["assets"][number]

interface MirroredFileRequest {
  archivePath: string
  key: string
  contentType: string
  sha256: string
  body?: Uint8Array
}

export interface MirroredFile {
  key: string
  body: Uint8Array
  contentType: string
}

export function buildMirroredAssetKey(
  release: Pick<OtaRelease, "product" | "channel" | "runtimeVersion" | "releaseVersion">,
  platform: OtaPlatform,
  assetPath: string,
) {
  return [
    release.product,
    release.channel,
    release.runtimeVersion,
    release.releaseVersion,
    platform,
    normalizeArchivePath(assetPath),
  ].join("/")
}

export async function extractMirroredFiles(input: {
  release: OtaRelease
  archiveBuffer: ArrayBuffer | Uint8Array
}): Promise<MirroredFile[]> {
  const compressedArchive =
    input.archiveBuffer instanceof Uint8Array
      ? input.archiveBuffer
      : new Uint8Array(input.archiveBuffer)
  const requestedFiles = createMirroredFileRequests(input.release)
  const requestsByArchivePath = new Map<string, MirroredFileRequest[]>()

  for (const request of requestedFiles) {
    const requestsForPath = requestsByArchivePath.get(request.archivePath)

    if (requestsForPath) {
      requestsForPath.push(request)
      continue
    }

    requestsByArchivePath.set(request.archivePath, [request])
  }

  const missingArchivePaths = new Set(requestsByArchivePath.keys())
  const tarExtract = tar.extract()

  const extractedFiles = await new Promise<MirroredFile[]>((resolve, reject) => {
    const rejectOnce = once(reject)
    const resolveOnce = once(resolve)

    tarExtract.on("entry", (header, stream, next) => {
      const archivePath = normalizeArchivePath(header.name)
      const matchingRequests = requestsByArchivePath.get(archivePath)
      const chunks: Uint8Array[] = []

      stream.on("data", (chunk) => {
        if (matchingRequests) {
          chunks.push(new Uint8Array(chunk))
        }
      })
      stream.on("error", (error) => {
        rejectOnce(toError(error))
      })
      stream.on("end", async () => {
        if (matchingRequests) {
          const body = concatenateChunks(chunks)
          const bodySha256 = await sha256Hex(body)

          for (const request of matchingRequests) {
            if (request.sha256 !== bodySha256) {
              rejectOnce(
                new Error(
                  `Archive file "${archivePath}" hash mismatch: expected ${request.sha256} but received ${bodySha256}`,
                ),
              )
              return
            }

            request.body = body
          }

          missingArchivePaths.delete(archivePath)
        }

        next()
      })
      stream.resume()
    })

    tarExtract.on("error", (error) => {
      rejectOnce(toError(error))
    })
    tarExtract.on("finish", () => {
      if (missingArchivePaths.size > 0) {
        rejectOnce(
          new Error(
            `Archive is missing referenced file "${[...missingArchivePaths][0]}" for ${input.release.releaseVersion}`,
          ),
        )
        return
      }

      resolveOnce(
        requestedFiles.map((request) => ({
          key: request.key,
          body: request.body ?? new Uint8Array(0),
          contentType: request.contentType,
        })),
      )
    })

    const zstdStream = new Decompress((chunk, final) => {
      if (chunk.byteLength > 0) {
        tarExtract.write(chunk)
      }

      if (final) {
        tarExtract.end()
      }
    })

    try {
      zstdStream.push(compressedArchive, true)
    } catch (error) {
      rejectOnce(toError(error))
    }
  })

  return extractedFiles
}

function createMirroredFileRequests(release: OtaRelease): MirroredFileRequest[] {
  const requests: MirroredFileRequest[] = []

  for (const platform of OTA_PLATFORMS) {
    const platformPayload = release.platforms[platform]

    if (!platformPayload) {
      continue
    }

    for (const asset of listReferencedAssets(platformPayload)) {
      const archivePath = normalizeArchivePath(asset.path)

      requests.push({
        archivePath,
        key: buildMirroredAssetKey(release, platform, archivePath),
        contentType: asset.contentType,
        sha256: asset.sha256,
      })
    }
  }

  return requests
}

function listReferencedAssets(platformPayload: PlatformPayload): PlatformAsset[] {
  const dedupedAssets = new Map<string, PlatformAsset>()

  for (const asset of [platformPayload.launchAsset, ...platformPayload.assets]) {
    dedupedAssets.set(normalizeArchivePath(asset.path), asset)
  }

  return [...dedupedAssets.values()]
}

function normalizeArchivePath(path: string) {
  return path
    .replace(/^\/+/, "")
    .replace(/^(\.\/)+/, "")
    .replaceAll(/\/{2,}/g, "/")
}

function concatenateChunks(chunks: readonly Uint8Array[]) {
  if (chunks.length === 0) {
    return new Uint8Array(0)
  }

  if (chunks.length === 1) {
    return chunks[0]!.slice()
  }

  const totalLength = chunks.reduce((length, chunk) => length + chunk.byteLength, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }

  return output
}

function once<T extends (...args: never[]) => void>(callback: T): T {
  let called = false

  return ((...args: Parameters<T>) => {
    if (called) {
      return
    }

    called = true
    callback(...args)
  }) as T
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}

async function sha256Hex(data: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", toDigestInput(data))

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function toDigestInput(data: Uint8Array) {
  return new Uint8Array(data)
}
