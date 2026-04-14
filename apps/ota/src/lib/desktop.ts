import { buildManifest, resolveManifestId } from "./manifest"
import type { DesktopOtaRelease, OtaRelease } from "./schema"
import { compareSemver } from "./version"

export function buildDesktopManifestResponse(
  release: DesktopOtaRelease,
  input: {
    origin: string
    platform: "macos" | "windows" | "linux"
    distribution: "direct" | "mas" | "mss"
    installedBinaryVersion: string | null
    rendererVersion: string | null
  },
) {
  const rendererManifest = buildManifest(release, {
    origin: input.origin,
    platform: input.platform,
  })

  const renderer =
    release.desktop.renderer &&
    isVersionOutdated(input.rendererVersion, release.desktop.renderer.version)
      ? {
          releaseVersion: release.releaseVersion,
          version: release.desktop.renderer.version,
          commit: release.desktop.renderer.commit,
          launchAsset: rendererManifest.launchAsset,
          assets: rendererManifest.assets,
        }
      : null

  const desktopApp = release.desktop.app?.platforms[input.platform]
  const app =
    input.distribution === "direct" &&
    desktopApp &&
    isVersionOutdated(input.installedBinaryVersion, release.releaseVersion)
      ? {
          releaseVersion: release.releaseVersion,
          version: release.releaseVersion,
          platform: desktopApp.platform,
          releaseDate: desktopApp.releaseDate,
          manifest: desktopApp.manifest,
          files: desktopApp.files,
        }
      : null

  if (!renderer && !app) {
    return null
  }

  return {
    id: resolveManifestId(release, input.platform),
    createdAt: release.publishedAt,
    product: "desktop" as const,
    channel: release.channel,
    runtimeVersion: release.runtimeVersion,
    renderer,
    app,
  }
}

export function isDesktopRelease(release: OtaRelease): release is DesktopOtaRelease {
  return release.product === "desktop"
}

function isVersionOutdated(current: string | null, latest: string | null) {
  if (!latest) {
    return false
  }

  if (!current) {
    return true
  }

  return compareSemver(current, latest) < 0
}
