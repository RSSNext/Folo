import type { Env } from "../env"
import type { MirroredFile } from "./archive"
import { buildMirroredAssetKey, extractMirroredFiles } from "./archive"
import { KV_KEYS } from "./constants"
import { listPublishedOtaReleases } from "./github"
import type { LatestReleasePointerRecord } from "./kv"
import { putReleaseRecord } from "./kv"
import { putMirroredFiles } from "./r2"
import type { OtaPlatform, OtaRelease } from "./schema"
import { otaReleaseSchema } from "./schema"
import { compareSemver } from "./version"

const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]
const semverPattern = /^\d+\.\d+\.\d+$/
let inFlightSync: Promise<void> | null = null

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

async function runSyncGitHubReleases(env: Env) {
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

    if (release.releaseKind === "ota") {
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

  if (releasesResult.etag) {
    await env.OTA_KV.put(KV_KEYS.githubEtag, releasesResult.etag)
  }

  await updateSyncLastSuccessAt(env.OTA_KV)
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
  const platformPayload = release.platforms[platform]

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
  const existingPolicyRecord = await kv.get<OtaRelease>(
    KV_KEYS.policy(release.product, release.channel),
    "json",
  )

  if (!shouldPersistReleaseVersion(existingPolicyRecord?.releaseVersion, release.releaseVersion)) {
    return
  }

  await kv.put(KV_KEYS.policy(release.product, release.channel), JSON.stringify(release))
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
