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

export interface StoreVersionRecord {
  version: string
  fetchedAt: string
  source: "app-store" | "google-play" | "mac-app-store" | "microsoft-store"
}

export interface LatestReleaseVersionRecord {
  product: OtaRelease["product"]
  version: OtaRelease["releaseVersion"]
  publishedAt: string
  tag: string
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

export async function getStoreVersionRecord(
  kv: KVNamespace,
  input: {
    product: OtaRelease["product"]
    target: "ios" | "android" | DesktopDistribution
  },
) {
  return kv.get<StoreVersionRecord>(KV_KEYS.storeVersion(input.product, input.target), "json")
}

export async function putStoreVersionRecord(
  kv: KVNamespace,
  input: {
    product: OtaRelease["product"]
    target: "ios" | "android" | DesktopDistribution
    value: StoreVersionRecord
  },
) {
  await kv.put(KV_KEYS.storeVersion(input.product, input.target), JSON.stringify(input.value))
}

export async function getLatestReleaseVersionRecord(
  kv: KVNamespace,
  product: OtaRelease["product"],
) {
  return kv.get<LatestReleaseVersionRecord>(KV_KEYS.latestReleaseVersion(product), "json")
}

export async function putLatestReleaseVersionRecord(
  kv: KVNamespace,
  value: LatestReleaseVersionRecord,
) {
  await kv.put(KV_KEYS.latestReleaseVersion(value.product), JSON.stringify(value))
}
