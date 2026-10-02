import type { Env } from "../env"
import type { GitHubRelease } from "./github"
import { fetchGitHubReleases } from "./github"
import type { LatestAndroidApkRecord, LatestReleaseVersionRecord } from "./kv"
import {
  getLatestAndroidApkRecord,
  getLatestReleaseVersionRecord,
  putLatestAndroidApkRecord,
  putLatestReleaseVersionRecord,
} from "./kv"
import { compareSemver } from "./version"

const ANDROID_APK_ASSET_NAME = "build.apk"

const productReleaseTagPattern = /^(mobile|desktop)\/v(\d+\.\d+\.\d+)$/
const semverPattern = /^\d+\.\d+\.\d+$/

export interface LatestProductReleases {
  mobile: LatestReleaseVersionRecord | null
  desktop: LatestReleaseVersionRecord | null
  androidApk: LatestAndroidApkRecord | null
}

type LatestReleaseEnv = Pick<Env, "OTA_KV" | "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_TOKEN">

/**
 * Picks the newest published (non-draft, non-prerelease) `mobile/vX.Y.Z` and `desktop/vX.Y.Z`
 * GitHub releases, whether or not they carry OTA metadata. The Android APK record only considers
 * mobile releases that actually ship a `build.apk` asset.
 */
export function selectLatestProductReleases(
  releases: readonly GitHubRelease[],
): LatestProductReleases {
  const latest: LatestProductReleases = {
    mobile: null,
    desktop: null,
    androidApk: null,
  }

  for (const release of releases) {
    if (release.draft || release.prerelease || !release.published_at) {
      continue
    }

    const parsed = parseProductReleaseTag(release.tag_name)
    if (!parsed) {
      continue
    }

    const currentRelease = latest[parsed.product]
    if (!currentRelease || compareSemver(parsed.version, currentRelease.version) > 0) {
      latest[parsed.product] = {
        product: parsed.product,
        version: parsed.version,
        publishedAt: release.published_at,
        tag: release.tag_name,
      }
    }

    if (parsed.product !== "mobile") {
      continue
    }

    const apkAsset = release.assets?.find((asset) => asset.name === ANDROID_APK_ASSET_NAME)
    if (!apkAsset?.browser_download_url) {
      continue
    }

    if (!latest.androidApk || compareSemver(parsed.version, latest.androidApk.version) > 0) {
      latest.androidApk = {
        version: parsed.version,
        publishedAt: release.published_at,
        tag: release.tag_name,
        downloadUrl: apkAsset.browser_download_url,
      }
    }
  }

  return latest
}

async function getLatestProductReleases(kv: KVNamespace): Promise<LatestProductReleases> {
  const [mobile, desktop, androidApk] = await Promise.all([
    getLatestReleaseVersionRecord(kv, "mobile"),
    getLatestReleaseVersionRecord(kv, "desktop"),
    getLatestAndroidApkRecord(kv),
  ])

  return {
    mobile,
    desktop,
    androidApk,
  }
}

/**
 * Stores the selected releases and returns the records that are current afterwards. Records only
 * move forward, so a partial release page or an out-of-order sync never rolls a download link back.
 */
export async function persistLatestProductReleases(
  kv: KVNamespace,
  next: LatestProductReleases,
): Promise<LatestProductReleases> {
  const current = await getLatestProductReleases(kv)
  const [mobile, desktop, androidApk] = await Promise.all([
    persistNewerRecord(current.mobile, next.mobile, (value) =>
      putLatestReleaseVersionRecord(kv, value),
    ),
    persistNewerRecord(current.desktop, next.desktop, (value) =>
      putLatestReleaseVersionRecord(kv, value),
    ),
    persistNewerRecord(current.androidApk, next.androidApk, (value) =>
      putLatestAndroidApkRecord(kv, value),
    ),
  ])

  return {
    mobile,
    desktop,
    androidApk,
  }
}

/**
 * Reads the GitHub release list (without an ETag) and advances the latest release records.
 */
export async function refreshLatestProductReleases(
  env: LatestReleaseEnv,
): Promise<LatestProductReleases> {
  const releasesResult = await fetchGitHubReleases({
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    token: env.GITHUB_TOKEN,
    etag: null,
  })

  if (releasesResult.kind === "not-modified") {
    return getLatestProductReleases(env.OTA_KV)
  }

  return persistLatestProductReleases(
    env.OTA_KV,
    selectLatestProductReleases(releasesResult.releases),
  )
}

/**
 * Refreshes the latest release records only when one of them is missing, so an unchanged
 * GitHub release list does not cost an extra API request.
 */
export async function ensureLatestProductReleases(
  env: LatestReleaseEnv,
): Promise<LatestProductReleases> {
  const current = await getLatestProductReleases(env.OTA_KV)

  if (current.mobile && current.desktop && current.androidApk) {
    return current
  }

  return refreshLatestProductReleases(env)
}

async function persistNewerRecord<T extends { version: string }>(
  current: T | null,
  next: T | null,
  put: (value: T) => Promise<void>,
): Promise<T | null> {
  if (!next) {
    return current
  }

  if (current && isSemver(current.version) && compareSemver(next.version, current.version) <= 0) {
    return current
  }

  await put(next)

  return next
}

function parseProductReleaseTag(
  tag: string,
): { product: LatestReleaseVersionRecord["product"]; version: string } | null {
  const match = productReleaseTagPattern.exec(tag)
  if (!match) {
    return null
  }

  const [, product, version] = match
  if ((product !== "mobile" && product !== "desktop") || !version) {
    return null
  }

  return {
    product,
    version,
  }
}

function isSemver(value: unknown): value is string {
  return typeof value === "string" && semverPattern.test(value)
}
