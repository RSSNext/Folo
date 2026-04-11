import { KV_KEYS } from "./constants"
import type { OtaPlatform, OtaRelease } from "./schema"

export interface LatestReleasePointerRecord {
  releaseVersion: OtaRelease["releaseVersion"]
}

export type ReleaseRecord = OtaRelease

export async function getLatestReleasePointer(
  kv: KVNamespace,
  input: {
    product: OtaRelease["product"]
    channel: OtaRelease["channel"]
    runtimeVersion: OtaRelease["runtimeVersion"]
    platform: OtaPlatform
  },
) {
  return kv.get<LatestReleasePointerRecord>(
    KV_KEYS.latest(input.product, input.channel, input.runtimeVersion, input.platform),
    "json",
  )
}

export async function putReleaseRecord(
  kv: KVNamespace,
  product: OtaRelease["product"],
  releaseVersion: OtaRelease["releaseVersion"],
  value: ReleaseRecord,
) {
  await kv.put(KV_KEYS.release(product, releaseVersion), JSON.stringify(value))
}
