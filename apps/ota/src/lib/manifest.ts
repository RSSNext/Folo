import { createHash } from "node:crypto"

import { buildMirroredAssetKey } from "./archive"
import type { OtaPlatform, OtaPlatformPayload, OtaProjectedPlatforms, OtaRelease } from "./schema"

type PlatformPayload = OtaPlatformPayload
type PlatformAsset = PlatformPayload["launchAsset"] | PlatformPayload["assets"][number]
type MobileExpoClientConfig = {
  name: string
  slug: string
  owner: string
  version: string
  runtimeVersion: string
  orientation: "portrait"
  scheme: string[]
  userInterfaceStyle: "automatic"
  updates: {
    url: string
    requestHeaders: {
      "expo-channel-name": string
    }
    codeSigningMetadata: {
      keyid: string
      alg: string
    }
    checkAutomatically: "NEVER"
  }
  ios: {
    bundleIdentifier: string
    supportsTablet: boolean
    usesAppleSignIn: boolean
  }
  android: {
    package: string
  }
  extra: {
    eas: {
      projectId: string
    }
  }
}

const MOBILE_UPDATE_URL = "https://ota.folo.is/manifest"
const MOBILE_EAS_PROJECT_ID = "a6335b14-fb84-45aa-ba80-6f6ab8926920"

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
    expoClient?: MobileExpoClientConfig
  }
}

export function buildManifest(
  release: OtaRelease,
  input: {
    origin: string
    platform: OtaPlatform
  },
): OtaManifest {
  const platforms = release.platforms as OtaProjectedPlatforms
  const platformPayload = platforms[input.platform]

  if (!platformPayload) {
    throw new Error(
      `Release ${release.releaseVersion} does not include a ${input.platform} payload`,
    )
  }

  return {
    id: resolveManifestId(release, input.platform),
    createdAt: release.publishedAt,
    runtimeVersion: release.runtimeVersion ?? release.releaseVersion,
    launchAsset: toManifestAsset(
      release,
      input.origin,
      input.platform,
      platformPayload.launchAsset,
    ),
    assets: platformPayload.assets.map((asset: PlatformAsset) =>
      toManifestAsset(release, input.origin, input.platform, asset),
    ),
    metadata: {
      channel: release.channel,
      releaseVersion: release.releaseVersion,
    },
    extra: buildManifestExtra(release),
  }
}

export function resolveManifestId(release: OtaRelease, platform: OtaPlatform) {
  if (release.updateId) {
    return release.updateId
  }

  return createDeterministicUuid(
    `${release.product}:${release.channel}:${release.releaseVersion}:${release.runtimeVersion}:${platform}`,
  )
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

function buildManifestExtra(release: OtaRelease): OtaManifest["extra"] {
  const extra: OtaManifest["extra"] = {
    product: release.product,
  }

  if (release.product === "mobile") {
    // Expo Updates hydrates Constants.expoConfig from extra.expoClient after an OTA launch.
    extra.expoClient = buildMobileExpoClientConfig(release)
  }

  return extra
}

function buildMobileExpoClientConfig(release: Extract<OtaRelease, { product: "mobile" }>) {
  return {
    name: "Folo",
    slug: "follow",
    owner: "follow",
    version: release.releaseVersion,
    runtimeVersion: release.runtimeVersion,
    orientation: "portrait",
    scheme: ["follow", "folo"],
    userInterfaceStyle: "automatic",
    updates: {
      url: MOBILE_UPDATE_URL,
      requestHeaders: {
        "expo-channel-name": release.channel,
      },
      codeSigningMetadata: {
        keyid: "main",
        alg: "rsa-v1_5-sha256",
      },
      checkAutomatically: "NEVER",
    },
    ios: {
      bundleIdentifier: "is.follow",
      supportsTablet: true,
      usesAppleSignIn: true,
    },
    android: {
      package: "is.follow",
    },
    extra: {
      eas: {
        projectId: MOBILE_EAS_PROJECT_ID,
      },
    },
  } satisfies MobileExpoClientConfig
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

function createDeterministicUuid(seed: string) {
  const digest = createHash("sha1").update(seed).digest()
  const bytes = Uint8Array.from(digest.subarray(0, 16))

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const hex = Buffer.from(bytes).toString("hex")
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
}
