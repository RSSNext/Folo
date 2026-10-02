import { Decompress } from "fzstd"
import tar from "tar-stream"

import type { OtaPlatform, OtaPlatformPayload, OtaProjectedPlatforms, OtaRelease } from "./schema"

const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]

type PlatformPayload = OtaPlatformPayload
type PlatformAsset = PlatformPayload["launchAsset"] | PlatformPayload["assets"][number]

interface MirroredFileRequest {
  archivePath: string
  key: string
  contentType: string
  sha256: string
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

type ArchiveSource = ReadableStream<Uint8Array> | ArrayBuffer | Uint8Array

// In-memory archives are fed to the decompressor in slices so they get the same backpressure as
// streamed downloads
const ARCHIVE_SLICE_BYTES = 64 * 1024

/**
 * Streams a zstd-compressed tar archive and hands every referenced file to `onFile` as soon as it has
 * been extracted and verified. Memory stays bounded by the largest referenced file instead of the
 * whole archive, which matters for large desktop OTA payloads inside the Worker memory limit.
 * Resolves with the keys of the mirrored files.
 */
export async function mirrorArchiveFiles(input: {
  release: OtaRelease
  archive: ArchiveSource
  onFile: (file: MirroredFile) => Promise<void>
}): Promise<string[]> {
  const requestsByArchivePath = groupRequestsByArchivePath(
    createMirroredFileRequests(input.release),
  )
  const missingArchivePaths = new Set(requestsByArchivePath.keys())
  const mirroredKeys: string[] = []
  const tarExtract = tar.extract()
  let failure: Error | null = null

  const finished = new Promise<void>((resolve, reject) => {
    tarExtract.on("error", (error) => {
      failure ??= toError(error)
      reject(failure)
    })
    tarExtract.on("finish", () => resolve())
  })
  // The feeding loop below checks `failure`; the rejection itself is awaited at the end
  finished.catch(() => {})

  tarExtract.on("entry", (header, stream, next) => {
    const archivePath = normalizeArchivePath(header.name)
    const matchingRequests = requestsByArchivePath.get(archivePath)

    if (!matchingRequests) {
      stream.on("end", () => next())
      stream.resume()
      return
    }

    const size = header.size ?? 0
    const body = new Uint8Array(size)
    let offset = 0

    stream.on("data", (chunk: unknown) => {
      if (!(chunk instanceof Uint8Array)) {
        stream.destroy(new Error("Archive stream returned a non-binary chunk"))
        return
      }

      if (offset + chunk.byteLength > size) {
        stream.destroy(new Error(`Archive file "${archivePath}" is larger than its tar header`))
        return
      }

      body.set(chunk, offset)
      offset += chunk.byteLength
    })
    stream.on("error", (error) => {
      next(toError(error))
    })
    stream.on("end", () => {
      void (async () => {
        if (offset !== size) {
          throw new Error(`Archive file "${archivePath}" ended before its declared size`)
        }

        const bodySha256 = await sha256Hex(body)

        for (const request of matchingRequests) {
          if (request.sha256 !== bodySha256) {
            throw new Error(
              `Archive file "${archivePath}" hash mismatch: expected ${request.sha256} but received ${bodySha256}`,
            )
          }
        }

        for (const request of matchingRequests) {
          await input.onFile({
            key: request.key,
            body,
            contentType: request.contentType,
          })
          mirroredKeys.push(request.key)
        }

        missingArchivePaths.delete(archivePath)
      })().then(
        () => next(),
        (error: unknown) => next(toError(error)),
      )
    })
  })

  let needsDrain = false
  const decompressor = new Decompress((chunk, final) => {
    if (failure) {
      return
    }

    if (chunk.byteLength > 0 && !tarExtract.write(chunk)) {
      needsDrain = true
    }

    if (final) {
      tarExtract.end(null)
    }
  })

  try {
    for await (const chunk of iterateArchive(input.archive)) {
      if (failure) {
        break
      }

      decompressor.push(chunk)

      if (needsDrain && !failure) {
        needsDrain = false
        await Promise.race([
          new Promise<void>((resolve) => tarExtract.once("drain", () => resolve())),
          finished.then(
            () => {},
            () => {},
          ),
        ])
      }
    }

    if (!failure) {
      decompressor.push(new Uint8Array(0), true)
    }
  } catch (error) {
    failure ??= toError(error)
    tarExtract.destroy(failure)
  }

  await finished

  if (failure) {
    throw failure
  }

  if (missingArchivePaths.size > 0) {
    throw new Error(
      `Archive is missing referenced file "${[...missingArchivePaths][0]}" for ${input.release.releaseVersion}`,
    )
  }

  return mirroredKeys
}

/**
 * Extracts every referenced file into memory. Only suitable for small archives; the sync uses
 * {@link mirrorArchiveFiles} to upload files as they are extracted.
 */
export async function extractMirroredFiles(input: {
  release: OtaRelease
  archiveBuffer: ArrayBuffer | Uint8Array
}): Promise<MirroredFile[]> {
  const filesByKey = new Map<string, MirroredFile>()

  await mirrorArchiveFiles({
    release: input.release,
    archive: input.archiveBuffer,
    onFile: async (file) => {
      filesByKey.set(file.key, file)
    },
  })

  return createMirroredFileRequests(input.release).flatMap((request) => {
    const file = filesByKey.get(request.key)
    return file ? [file] : []
  })
}

async function* iterateArchive(archive: ArchiveSource): AsyncGenerator<Uint8Array> {
  if (archive instanceof ReadableStream) {
    const reader = archive.getReader()
    let completed = false

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          completed = true
          return
        }

        if (value.byteLength > 0) {
          yield value
        }
      }
    } finally {
      // Stop the download when extraction bails out early
      if (!completed) {
        await reader.cancel().catch(() => {})
      }
      reader.releaseLock()
    }
  }

  const bytes = archive instanceof Uint8Array ? archive : new Uint8Array(archive)

  for (let offset = 0; offset < bytes.byteLength; offset += ARCHIVE_SLICE_BYTES) {
    yield bytes.subarray(offset, offset + ARCHIVE_SLICE_BYTES)
  }
}

function groupRequestsByArchivePath(requests: readonly MirroredFileRequest[]) {
  const requestsByArchivePath = new Map<string, MirroredFileRequest[]>()

  for (const request of requests) {
    const requestsForPath = requestsByArchivePath.get(request.archivePath)

    if (requestsForPath) {
      requestsForPath.push(request)
      continue
    }

    requestsByArchivePath.set(request.archivePath, [request])
  }

  return requestsByArchivePath
}

function createMirroredFileRequests(release: OtaRelease): MirroredFileRequest[] {
  const requests: MirroredFileRequest[] = []
  const platforms = release.platforms as OtaProjectedPlatforms

  for (const platform of OTA_PLATFORMS) {
    const platformPayload = platforms[platform]

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

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}

async function sha256Hex(data: Uint8Array<ArrayBuffer>) {
  const digest = await crypto.subtle.digest("SHA-256", data)

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}
