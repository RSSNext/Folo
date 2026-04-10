import { buildMirroredAssetKey } from "./archive"
import type { OtaPlatform, OtaRelease } from "./schema"

type PlatformPayload = NonNullable<OtaRelease["platforms"][OtaPlatform]>
type PlatformAsset = PlatformPayload["launchAsset"] | PlatformPayload["assets"][number]

export interface ManifestAsset {
  key: string
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
    id: `${release.product}-${release.channel}-${release.releaseVersion}-${input.platform}`,
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
  return {
    key: asset.path,
    contentType: asset.contentType,
    url: new URL(
      `/assets/${buildMirroredAssetKey(release, platform, asset.path)}`,
      origin,
    ).toString(),
  }
}
