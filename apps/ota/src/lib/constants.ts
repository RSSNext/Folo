import type { DesktopDistribution, OtaPlatform, OtaRelease } from "./schema"

export const KV_KEYS = {
  release: (product: OtaRelease["product"], releaseVersion: OtaRelease["releaseVersion"]) =>
    `release:${product}:${releaseVersion}`,
  latest: (
    product: OtaRelease["product"],
    channel: OtaRelease["channel"],
    runtimeVersion: OtaRelease["runtimeVersion"],
    platform: OtaPlatform,
  ) => `latest:${product}:${channel}:${runtimeVersion}:${platform}`,
  policy: (
    product: OtaRelease["product"],
    channel: OtaRelease["channel"],
    distribution?: DesktopDistribution,
  ) =>
    distribution ? `policy:${product}:${channel}:${distribution}` : `policy:${product}:${channel}`,
  storeVersion: (product: OtaRelease["product"], target: "ios" | "android" | DesktopDistribution) =>
    `store-version:${product}:${target}`,
  latestReleaseVersion: (product: OtaRelease["product"]) => `latest-release:${product}`,
  githubEtag: "github:etag:releases",
  syncLastSuccessAt: "sync:last-success-at",
  storeVersionSyncLastSuccessAt: "sync:store-version-last-success-at",
} as const
