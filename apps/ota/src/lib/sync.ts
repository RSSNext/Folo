import type { Env } from "../env"
import type { MirroredFile } from "./archive"
import { buildMirroredAssetKey, mirrorArchiveFiles } from "./archive"
import { KV_KEYS } from "./constants"
import { fetchGitHubReleases, toOtaReleaseSummaries } from "./github"
import type { BinaryPolicyRecord, LatestReleasePointerRecord } from "./kv"
import { putBinaryPolicyRecord, putReleaseRecord, putStoreVersionRecord } from "./kv"
import {
  ensureLatestProductReleases,
  persistLatestProductReleases,
  selectLatestProductReleases,
} from "./latest-release"
import { putMirroredFiles } from "./r2"
import type { DesktopDistribution, OtaPlatform, OtaProjectedPlatforms, OtaRelease } from "./schema"
import { otaReleaseSchema } from "./schema"
import { fetchDesktopStoreVersion, fetchMobileStoreVersion } from "./store-version"
import { compareSemver } from "./version"

const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]
const semverPattern = /^\d+\.\d+\.\d+$/
type ReleaseSummary = {
  tag: string
  metadataUrl: string
  archiveUrl: string | null
}
let inFlightSync: Promise<void> | null = null
let inFlightStoreSync: Promise<void> | null = null

export async function syncGitHubReleases(env: Env) {
  if (inFlightSync) {
    return inFlightSync
  }

  const syncPromise = runSyncGitHubReleases(env).finally(() => {
    if (inFlightSync === syncPromise) {
      inFlightSync = null
    }
  })

  inFlightSync = syncPromise

  return syncPromise
}

export async function syncStoreVersions(env: Env) {
  if (inFlightStoreSync) {
    return inFlightStoreSync
  }

  const syncPromise = runSyncStoreVersions(env).finally(() => {
    if (inFlightStoreSync === syncPromise) {
      inFlightStoreSync = null
    }
  })

  inFlightStoreSync = syncPromise

  return syncPromise
}

async function runSyncGitHubReleases(env: Env) {
  const storedEtag = await env.OTA_KV.get<string>(KV_KEYS.githubEtag)
  const releasesResult = await fetchGitHubReleases({
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    token: env.GITHUB_TOKEN,
    etag: storedEtag ?? null,
  })

  if (releasesResult.kind === "not-modified") {
    await ensureLatestProductReleases(env)
    await updateSyncLastSuccessAt(env.OTA_KV)
    return
  }

  // Track the newest published release of each product from the plain release list before
  // mirroring OTA payloads: store-mode releases ship without OTA metadata, and a failing OTA
  // release must not hold back the download links.
  await persistLatestProductReleases(
    env.OTA_KV,
    selectLatestProductReleases(releasesResult.releases),
  )
  await persistReleaseSummaries(env, toOtaReleaseSummaries(releasesResult.releases))

  if (releasesResult.etag) {
    await env.OTA_KV.put(KV_KEYS.githubEtag, releasesResult.etag)
  }

  await updateSyncLastSuccessAt(env.OTA_KV)
}

async function runSyncStoreVersions(env: Env) {
  const fetchedAt = new Date().toISOString()
  const syncTasks = [
    {
      product: "mobile" as const,
      target: "ios" as const,
      source: "app-store" as const,
      fetchVersion: () => fetchMobileStoreVersion("ios"),
    },
    {
      product: "mobile" as const,
      target: "android" as const,
      source: "google-play" as const,
      fetchVersion: () => fetchMobileStoreVersion("android"),
    },
    {
      product: "desktop" as const,
      target: "mas" as const,
      source: "mac-app-store" as const,
      fetchVersion: async () => (await fetchDesktopStoreVersion("mas")).version,
    },
    {
      product: "desktop" as const,
      target: "mss" as const,
      source: "microsoft-store" as const,
      fetchVersion: async () => (await fetchDesktopStoreVersion("mss")).version,
    },
  ]

  const results = await Promise.allSettled(
    syncTasks.map(async (task) => {
      const version = await task.fetchVersion()
      if (!version) {
        throw new Error(`No store version found for ${task.product}:${task.target}`)
      }

      await putStoreVersionRecord(env.OTA_KV, {
        product: task.product,
        target: task.target,
        value: {
          version,
          fetchedAt,
          source: task.source,
        },
      })
    }),
  )

  const failures = results.flatMap((result, index) => {
    const task = syncTasks[index]

    if (!task || result.status === "fulfilled") {
      return []
    }

    return [
      {
        task,
        reason: result.reason,
      },
    ]
  })

  for (const failure of failures) {
    console.error(
      `[ota] Failed to refresh store version for ${failure.task.product}:${failure.task.target}`,
      failure.reason,
    )
  }

  if (failures.length === syncTasks.length) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      "Failed to refresh all store versions",
    )
  }

  if (failures.length > 0) {
    console.warn(
      `[ota] Store version sync completed with ${failures.length} failure(s); refreshed ${syncTasks.length - failures.length}/${syncTasks.length} providers`,
    )
  }

  await env.OTA_KV.put(KV_KEYS.storeVersionSyncLastSuccessAt, fetchedAt)
}

async function persistReleaseSummaries(env: Env, releases: ReleaseSummary[]) {
  const failures: unknown[] = []

  // One broken release must not keep the others from syncing. Failures still fail the run, so the
  // stored ETag and lastSuccessAt stay put and the next run retries them.
  for (const releaseSummary of releases) {
    try {
      await persistReleaseSummary(env, releaseSummary)
    } catch (error) {
      console.error(`[ota] Failed to sync release ${releaseSummary.tag}`, error)
      failures.push(error)
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, `Failed to sync ${failures.length} release(s)`)
  }
}

async function persistReleaseSummary(env: Env, releaseSummary: ReleaseSummary) {
  const release = await fetchReleaseMetadata(releaseSummary.metadataUrl, env)

  if (release.releaseKind !== "ota") {
    await putReleaseRecord(env.OTA_KV, release.product, release.releaseVersion, release)
    await putLatestPolicyRecord(env.OTA_KV, release)
    return
  }

  if (!releaseSummary.archiveUrl) {
    throw new Error(
      `Missing OTA archive asset for ${release.product} release ${release.releaseVersion}`,
    )
  }

  // The release list changes whenever download counts do, so every run sees the same releases
  // again. Re-downloading and extracting every archive each time exceeded the Worker memory
  // limit, so skip releases whose mirrored files are already in R2.
  const storedRelease = await getStoredReleaseRecord(env.OTA_KV, release)

  if (storedRelease && JSON.stringify(storedRelease) === JSON.stringify(release)) {
    // Still reconcile the pointers in case an earlier run stopped right after storing the record
    await advanceLatestPointers(release, listMirroredKeys(release), env.OTA_KV)
    return
  }

  if (storedRelease && hasSameMirroredFiles(storedRelease, release)) {
    await recordMirroredRelease(release, listMirroredKeys(release), env.OTA_KV)
    return
  }

  const archiveStream = await fetchArchiveStream(releaseSummary.archiveUrl, env)
  const mirroredKeys = await mirrorArchiveFiles({
    release,
    archive: archiveStream,
    onFile: (file) => putMirroredFiles(env.OTA_BUCKET, [file]),
  })

  await recordMirroredRelease(release, mirroredKeys, env.OTA_KV)
}

async function getStoredReleaseRecord(kv: KVNamespace, release: OtaRelease) {
  const storedRelease = await kv.get<unknown>(
    KV_KEYS.release(release.product, release.releaseVersion),
    "json",
  )
  const parsed = otaReleaseSchema.safeParse(storedRelease)

  return parsed.success ? parsed.data : null
}

function hasSameMirroredFiles(left: OtaRelease, right: OtaRelease) {
  return (
    JSON.stringify(listMirroredFileDigests(left)) === JSON.stringify(listMirroredFileDigests(right))
  )
}

function listMirroredFileDigests(release: OtaRelease) {
  const platforms = release.platforms as OtaProjectedPlatforms

  return OTA_PLATFORMS.flatMap((platform) => {
    const platformPayload = platforms[platform]

    if (!platformPayload) {
      return []
    }

    return [platformPayload.launchAsset, ...platformPayload.assets]
      .map((asset) => `${buildMirroredAssetKey(release, platform, asset.path)}:${asset.sha256}`)
      .sort()
  })
}

function listMirroredKeys(release: OtaRelease) {
  const platforms = release.platforms as OtaProjectedPlatforms

  return OTA_PLATFORMS.flatMap((platform) => {
    const platformPayload = platforms[platform]

    if (!platformPayload) {
      return []
    }

    return [platformPayload.launchAsset, ...platformPayload.assets].map((asset) =>
      buildMirroredAssetKey(release, platform, asset.path),
    )
  })
}

export async function mirrorReleaseToStorage(
  input: {
    release: OtaRelease
    files: readonly MirroredFile[]
  },
  env: {
    kv: KVNamespace
    bucket: R2Bucket
  },
) {
  await putMirroredFiles(env.bucket, input.files)
  await recordMirroredRelease(
    input.release,
    input.files.map((file) => file.key),
    env.kv,
  )
}

/**
 * Stores the release metadata and moves the latest pointers of every platform whose payload was
 * fully mirrored.
 */
async function recordMirroredRelease(
  release: OtaRelease,
  mirroredKeys: readonly string[],
  kv: KVNamespace,
) {
  await putReleaseRecord(kv, release.product, release.releaseVersion, release)
  await advanceLatestPointers(release, mirroredKeys, kv)
}

async function advanceLatestPointers(
  release: OtaRelease,
  mirroredKeys: readonly string[],
  kv: KVNamespace,
) {
  const mirroredFileKeys = new Set(mirroredKeys)

  for (const platform of OTA_PLATFORMS) {
    if (!hasCompleteMirroredPayload(release, platform, mirroredFileKeys)) {
      continue
    }

    const latestKey = KV_KEYS.latest(
      release.product,
      release.channel,
      release.runtimeVersion,
      platform,
    )
    const currentPointer = await kv.get<LatestReleasePointerRecord>(latestKey, "json")

    if (!shouldPersistReleaseVersion(currentPointer?.releaseVersion, release.releaseVersion)) {
      continue
    }

    const latestReleasePointer: LatestReleasePointerRecord = {
      releaseVersion: release.releaseVersion,
    }
    await kv.put(latestKey, JSON.stringify(latestReleasePointer))
  }
}

function hasCompleteMirroredPayload(
  release: OtaRelease,
  platform: OtaPlatform,
  mirroredFileKeys: ReadonlySet<string>,
) {
  const platforms = release.platforms as OtaProjectedPlatforms
  const platformPayload = platforms[platform]

  if (!platformPayload) {
    return false
  }

  for (const asset of [platformPayload.launchAsset, ...platformPayload.assets]) {
    if (!mirroredFileKeys.has(buildMirroredAssetKey(release, platform, asset.path))) {
      return false
    }
  }

  return true
}

async function putLatestPolicyRecord(kv: KVNamespace, release: OtaRelease) {
  if (release.product === "desktop") {
    await putDesktopPolicyRecords(kv, release)
    return
  }

  if (release.releaseKind !== "store") {
    return
  }

  const existingPolicyRecord = await kv.get<OtaRelease>(
    KV_KEYS.policy(release.product, release.channel),
    "json",
  )

  if (!shouldPersistReleaseVersion(existingPolicyRecord?.releaseVersion, release.releaseVersion)) {
    return
  }

  await kv.put(KV_KEYS.policy(release.product, release.channel), JSON.stringify(release))
}

async function putDesktopPolicyRecords(kv: KVNamespace, release: OtaRelease) {
  if (release.product !== "desktop" || release.releaseKind !== "binary") {
    return
  }

  const genericRecord: BinaryPolicyRecord = {
    releaseVersion: release.releaseVersion,
    required: release.policy.required,
    minSupportedBinaryVersion: release.policy.minSupportedBinaryVersion,
    message: release.policy.message,
    publishedAt: release.publishedAt,
    distribution: null,
    downloadUrl: null,
    storeUrl: null,
  }

  const existingGenericRecord = await kv.get<BinaryPolicyRecord>(
    KV_KEYS.policy(release.product, release.channel),
    "json",
  )

  if (shouldPersistReleaseVersion(existingGenericRecord?.releaseVersion, release.releaseVersion)) {
    await putBinaryPolicyRecord(kv, {
      product: release.product,
      channel: release.channel,
      value: genericRecord,
    })
  }

  for (const distribution of Object.keys(release.policy.distributions) as DesktopDistribution[]) {
    const value = release.policy.distributions[distribution]
    if (!value) {
      continue
    }
    const policyRecord: BinaryPolicyRecord = {
      releaseVersion: release.releaseVersion,
      required: release.policy.required,
      minSupportedBinaryVersion: release.policy.minSupportedBinaryVersion,
      message: release.policy.message,
      publishedAt: release.publishedAt,
      distribution,
      downloadUrl: value.downloadUrl ?? null,
      storeUrl: value.storeUrl ?? null,
    }

    const existingRecord = await kv.get<BinaryPolicyRecord>(
      KV_KEYS.policy(release.product, release.channel, distribution),
      "json",
    )

    if (!shouldPersistReleaseVersion(existingRecord?.releaseVersion, release.releaseVersion)) {
      continue
    }

    await putBinaryPolicyRecord(kv, {
      product: release.product,
      channel: release.channel,
      distribution,
      value: policyRecord,
    })
  }

  const knownDistributions: DesktopDistribution[] = ["direct", "mas", "mss"]

  for (const distribution of knownDistributions) {
    if (distribution in release.policy.distributions) {
      continue
    }

    const existingRecord = await kv.get<BinaryPolicyRecord>(
      KV_KEYS.policy(release.product, release.channel, distribution),
      "json",
    )

    if (!shouldPersistReleaseVersion(existingRecord?.releaseVersion, release.releaseVersion)) {
      continue
    }

    await kv.delete(KV_KEYS.policy(release.product, release.channel, distribution))
  }
}

async function fetchReleaseMetadata(
  url: string,
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_TOKEN">,
): Promise<OtaRelease> {
  const response = await fetch(url, {
    headers: createGitHubAssetHeaders(env),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch OTA release metadata from ${url}: ${response.status}`)
  }

  return otaReleaseSchema.parse(await response.json())
}

async function fetchArchiveStream(
  url: string,
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_TOKEN">,
) {
  const response = await fetch(url, {
    headers: createGitHubAssetHeaders(env),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch OTA archive from ${url}: ${response.status}`)
  }

  return response.body
}

function createGitHubAssetHeaders(env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_TOKEN">) {
  return {
    Accept: "application/octet-stream",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": `folo-ota-worker/${env.GITHUB_OWNER}.${env.GITHUB_REPO}`,
  }
}

async function updateSyncLastSuccessAt(kv: KVNamespace) {
  await kv.put(KV_KEYS.syncLastSuccessAt, new Date().toISOString())
}

function shouldPersistReleaseVersion(currentVersion: unknown, nextVersion: string) {
  if (!isSemver(currentVersion)) {
    return true
  }

  return compareSemver(nextVersion, currentVersion) >= 0
}

function isSemver(value: unknown): value is string {
  return typeof value === "string" && semverPattern.test(value)
}
