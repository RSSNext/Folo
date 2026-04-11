import { buildMirroredAssetKey } from "./archive"
import type { OtaPlatform, OtaRelease } from "./schema"

type PlatformPayload = NonNullable<OtaRelease["platforms"][OtaPlatform]>
type PlatformAsset = PlatformPayload["launchAsset"] | PlatformPayload["assets"][number]

export interface ManifestAsset {
  key: string
  hash: string
  fileExtension?: string
  contentType: string
  url: string
}

export interface OtaManifest {
  id: string
  createdAt: string
  runtimeVersion: string
  launchAsset: ManifestAsset
  assets: ManifestAsset[]
  metadata: {
    channel: string
    releaseVersion: string
  }
  extra: {
    product: OtaRelease["product"]
  }
}

export function buildManifest(
  release: OtaRelease,
  input: {
    origin: string
    platform: OtaPlatform
  },
): OtaManifest {
  const platformPayload = release.platforms[input.platform]

  if (!platformPayload) {
    throw new Error(
      `Release ${release.releaseVersion} does not include a ${input.platform} payload`,
    )
  }

  return {
    id: release.updateId ?? crypto.randomUUID(),
    createdAt: release.publishedAt,
    runtimeVersion: release.runtimeVersion,
    launchAsset: toManifestAsset(
      release,
      input.origin,
      input.platform,
      platformPayload.launchAsset,
    ),
    assets: platformPayload.assets.map((asset) =>
      toManifestAsset(release, input.origin, input.platform, asset),
    ),
    metadata: {
      channel: release.channel,
      releaseVersion: release.releaseVersion,
    },
    extra: {
      product: release.product,
    },
  }
}

function toManifestAsset(
  release: OtaRelease,
  origin: string,
  platform: OtaPlatform,
  asset: PlatformAsset,
): ManifestAsset {
  const { key, fileExtension } = toExpoAssetIdentity(asset.path, asset.contentType)

  return {
    key,
    hash: toExpoManifestHash(asset.sha256),
    fileExtension,
    contentType: asset.contentType,
    url: new URL(
      `/assets/${buildMirroredAssetKey(release, platform, asset.path)}`,
      origin,
    ).toString(),
  }
}

function toExpoManifestHash(sha256Hex: string) {
  const bytes = hexToBytes(sha256Hex)
  return Buffer.from(bytes)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll(/=+$/g, "")
}

function hexToBytes(sha256Hex: string) {
  const normalized = sha256Hex.trim().toLowerCase()

  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    return new Uint8Array()
  }

  const bytes = new Uint8Array(normalized.length / 2)

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16)
  }

  return bytes
}

function toExpoAssetIdentity(path: string, contentType: string) {
  const fileName = path.split("/").at(-1) ?? path
  const extensionMatch = fileName.match(/(\.[^.]+)$/)

  if (extensionMatch?.[1]) {
    const fileExtension = extensionMatch[1]
    return {
      key: fileName.slice(0, -fileExtension.length),
      fileExtension,
    }
  }

  const inferredExtension = inferExtensionFromContentType(contentType)
  return {
    key: fileName,
    fileExtension: inferredExtension,
  }
}

function inferExtensionFromContentType(contentType: string) {
  switch (contentType) {
    case "application/javascript": {
      return ".bundle"
    }
    case "image/png": {
      return ".png"
    }
    case "image/jpeg": {
      return ".jpg"
    }
    case "image/webp": {
      return ".webp"
    }
    case "font/otf": {
      return ".otf"
    }
    case "font/ttf": {
      return ".ttf"
    }
    case "font/woff": {
      return ".woff"
    }
    case "font/woff2": {
      return ".woff2"
    }
    default: {
      return
    }
  }
}
