import { decompress } from "fzstd"

import type { OtaPlatform, OtaRelease } from "./schema"

const TAR_BLOCK_SIZE = 512
const textDecoder = new TextDecoder()
const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]

type PlatformPayload = NonNullable<OtaRelease["platforms"][OtaPlatform]>
type PlatformAsset = PlatformPayload["launchAsset"] | PlatformPayload["assets"][number]

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
    input.archiveBuffer instanceof Uint8Array ? input.archiveBuffer : new Uint8Array(input.archiveBuffer)
  const archiveEntries = parseTarArchive(decompress(compressedArchive))
  const files: MirroredFile[] = []

  for (const platform of OTA_PLATFORMS) {
    const platformPayload = input.release.platforms[platform]

    if (!platformPayload) {
      continue
    }

    for (const asset of listReferencedAssets(platformPayload)) {
      const assetPath = normalizeArchivePath(asset.path)
      const archiveBody = archiveEntries.get(assetPath)

      if (!archiveBody) {
        throw new Error(
          `Archive is missing referenced file "${assetPath}" for ${platform} in ${input.release.releaseVersion}`,
        )
      }

      files.push({
        key: buildMirroredAssetKey(input.release, platform, assetPath),
        body: archiveBody,
        contentType: asset.contentType,
      })
    }
  }

  return files
}

function listReferencedAssets(platformPayload: PlatformPayload): PlatformAsset[] {
  const dedupedAssets = new Map<string, PlatformAsset>()

  for (const asset of [platformPayload.launchAsset, ...platformPayload.assets]) {
    dedupedAssets.set(normalizeArchivePath(asset.path), asset)
  }

  return [...dedupedAssets.values()]
}

function parseTarArchive(archive: Uint8Array) {
  const entries = new Map<string, Uint8Array>()
  let offset = 0

  while (offset + TAR_BLOCK_SIZE <= archive.length) {
    const header = archive.subarray(offset, offset + TAR_BLOCK_SIZE)

    if (isZeroBlock(header)) {
      break
    }

    const fileName = readTarPath(header)
    const fileSize = parseTarOctal(header.subarray(124, 136))
    const fileType = header[156] ?? 0
    const fileStart = offset + TAR_BLOCK_SIZE
    const fileEnd = fileStart + fileSize

    if (fileEnd > archive.length) {
      throw new Error(`Archive entry "${fileName}" exceeds archive bounds`)
    }

    if (isRegularFile(fileType)) {
      entries.set(normalizeArchivePath(fileName), archive.slice(fileStart, fileEnd))
    }

    offset = fileStart + Math.ceil(fileSize / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE
  }

  return entries
}

function readTarPath(header: Uint8Array) {
  const name = readTarString(header.subarray(0, 100))
  const prefix = readTarString(header.subarray(345, 500))

  return prefix ? `${prefix}/${name}` : name
}

function readTarString(value: Uint8Array) {
  const terminatorIndex = value.indexOf(0)
  const sliceEnd = terminatorIndex === -1 ? value.length : terminatorIndex

  return textDecoder.decode(value.subarray(0, sliceEnd)).trim()
}

function parseTarOctal(value: Uint8Array) {
  const rawValue = readTarString(value).replaceAll("\0", "").trim()

  if (!rawValue) {
    return 0
  }

  const parsedValue = Number.parseInt(rawValue, 8)

  if (Number.isNaN(parsedValue)) {
    throw new TypeError(`Invalid tar entry size "${rawValue}"`)
  }

  return parsedValue
}

function normalizeArchivePath(path: string) {
  return path.replace(/^\/+/, "").replace(/^(\.\/)+/, "").replaceAll(/\/{2,}/g, "/")
}

function isRegularFile(fileType: number) {
  return fileType === 0 || fileType === 48
}

function isZeroBlock(block: Uint8Array) {
  return block.every((byte) => byte === 0)
}
