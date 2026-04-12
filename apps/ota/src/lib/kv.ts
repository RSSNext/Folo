import { KV_KEYS } from "./constants"
import type { DesktopDistribution, OtaPlatform, OtaRelease } from "./schema"

export interface LatestReleasePointerRecord {
  releaseVersion: OtaRelease["releaseVersion"]
}

export type ReleaseRecord = OtaRelease

export interface BinaryPolicyRecord {
  releaseVersion: OtaRelease["releaseVersion"]
  required: boolean
  minSupportedBinaryVersion: string
  message: string | null
  publishedAt: string | null
  distribution: DesktopDistribution | null
  downloadUrl: string | null
  storeUrl: string | null
}

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

export async function getBinaryPolicyRecord(
  kv: KVNamespace,
  input: {
    product: OtaRelease["product"]
    channel: OtaRelease["channel"]
    distribution?: DesktopDistribution
  },
) {
  return kv.get<BinaryPolicyRecord>(
    KV_KEYS.policy(input.product, input.channel, input.distribution),
    "json",
  )
}

export async function putBinaryPolicyRecord(
  kv: KVNamespace,
  input: {
    product: OtaRelease["product"]
    channel: OtaRelease["channel"]
    distribution?: DesktopDistribution
    value: BinaryPolicyRecord
  },
) {
  await kv.put(
    KV_KEYS.policy(input.product, input.channel, input.distribution),
    JSON.stringify(input.value),
  )
}
