import type { Env } from "../env"
import type { MirroredFile } from "./archive"
import { buildMirroredAssetKey, extractMirroredFiles } from "./archive"
import { KV_KEYS } from "./constants"
import { listPublishedOtaReleases } from "./github"
import type { BinaryPolicyRecord, LatestReleasePointerRecord } from "./kv"
import {
  putBinaryPolicyRecord,
  putLatestReleaseVersionRecord,
  putReleaseRecord,
  putStoreVersionRecord,
} from "./kv"
import { putMirroredFiles } from "./r2"
import type { DesktopDistribution, OtaPlatform, OtaProjectedPlatforms, OtaRelease } from "./schema"
import { otaReleaseSchema } from "./schema"
import { fetchDesktopStoreVersion, fetchMobileStoreVersion } from "./store-version"
import { compareSemver } from "./version"

const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]
const semverPattern = /^\d+\.\d+\.\d+$/
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
  const latestReleaseByProduct = new Map<
    OtaRelease["product"],
    Pick<OtaRelease, "releaseVersion" | "publishedAt"> & { tag: string }
  >()
  const storedEtag = await env.OTA_KV.get<string>(KV_KEYS.githubEtag)
  const releasesResult = await listPublishedOtaReleases({
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    token: env.GITHUB_TOKEN,
    etag: storedEtag ?? null,
  })

  if (releasesResult.kind === "not-modified") {
    await updateSyncLastSuccessAt(env.OTA_KV)
    return
  }

  for (const releaseSummary of releasesResult.releases) {
    const release = await fetchReleaseMetadata(releaseSummary.metadataUrl, env)
    updateLatestReleaseByProduct(latestReleaseByProduct, release)

    if (release.releaseKind === "ota") {
      if (!releaseSummary.archiveUrl) {
        throw new Error(
          `Missing OTA archive asset for ${release.product} release ${release.releaseVersion}`,
        )
      }

      const archiveBuffer = await fetchArchiveBuffer(releaseSummary.archiveUrl, env)
      const files = await extractMirroredFiles({
        release,
        archiveBuffer,
      })

      await mirrorReleaseToStorage(
        {
          release,
          files,
        },
        {
          kv: env.OTA_KV,
          bucket: env.OTA_BUCKET,
        },
      )

      continue
    }

    await putReleaseRecord(env.OTA_KV, release.product, release.releaseVersion, release)
    await putLatestPolicyRecord(env.OTA_KV, release)
  }

  for (const [product, latestRelease] of latestReleaseByProduct) {
    await putLatestReleaseVersionRecord(env.OTA_KV, {
      product,
      version: latestRelease.releaseVersion,
      publishedAt: latestRelease.publishedAt,
      tag: latestRelease.tag,
    })
  }

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

  const failures = results.filter((result) => result.status === "rejected")
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((result) => (result as PromiseRejectedResult).reason),
      "Failed to refresh one or more store versions",
    )
  }

  await env.OTA_KV.put(KV_KEYS.storeVersionSyncLastSuccessAt, fetchedAt)
}

function updateLatestReleaseByProduct(
  latestReleaseByProduct: Map<
    OtaRelease["product"],
    Pick<OtaRelease, "releaseVersion" | "publishedAt"> & { tag: string }
  >,
  release: OtaRelease,
) {
  const current = latestReleaseByProduct.get(release.product)
  if (!current || compareSemver(release.releaseVersion, current.releaseVersion) > 0) {
    latestReleaseByProduct.set(release.product, {
      releaseVersion: release.releaseVersion,
      publishedAt: release.publishedAt,
      tag: release.git.tag,
    })
  }
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
  await putReleaseRecord(env.kv, input.release.product, input.release.releaseVersion, input.release)

  const mirroredFileKeys = new Set(input.files.map((file) => file.key))

  for (const platform of OTA_PLATFORMS) {
    if (!hasCompleteMirroredPayload(input.release, platform, mirroredFileKeys)) {
      continue
    }

    const latestReleasePointer: LatestReleasePointerRecord = {
      releaseVersion: input.release.releaseVersion,
    }
    const currentPointer = await env.kv.get<LatestReleasePointerRecord>(
      KV_KEYS.latest(
        input.release.product,
        input.release.channel,
        input.release.runtimeVersion,
        platform,
      ),
      "json",
    )

    if (
      !shouldPersistReleaseVersion(currentPointer?.releaseVersion, input.release.releaseVersion)
    ) {
      continue
    }

    await env.kv.put(
      KV_KEYS.latest(
        input.release.product,
        input.release.channel,
        input.release.runtimeVersion,
        platform,
      ),
      JSON.stringify(latestReleasePointer),
    )
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

async function fetchArchiveBuffer(
  url: string,
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_TOKEN">,
) {
  const response = await fetch(url, {
    headers: createGitHubAssetHeaders(env),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch OTA archive from ${url}: ${response.status}`)
  }

  return new Uint8Array(await response.arrayBuffer())
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
