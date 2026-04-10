import type { MirroredFile } from "./archive"
import { buildMirroredAssetKey } from "./archive"
import { KV_KEYS } from "./constants"
import type { LatestReleasePointerRecord } from "./kv"
import { putReleaseRecord } from "./kv"
import { putMirroredFiles } from "./r2"
import type { OtaPlatform, OtaRelease } from "./schema"

const OTA_PLATFORMS: OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]

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
  await putReleaseRecord(
    env.kv,
    input.release.product,
    input.release.releaseVersion,
    input.release,
  )

  const mirroredFileKeys = new Set(input.files.map((file) => file.key))

  for (const platform of OTA_PLATFORMS) {
    if (!hasCompleteMirroredPayload(input.release, platform, mirroredFileKeys)) {
      continue
    }

    const latestReleasePointer: LatestReleasePointerRecord = {
      releaseVersion: input.release.releaseVersion,
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
