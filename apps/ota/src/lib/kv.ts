import { KV_KEYS } from "./constants"
import type { OtaPlatform, OtaRelease } from "./schema"

export async function getLatestReleasePointer<T = unknown>(
  kv: KVNamespace,
  input: {
    product: OtaRelease["product"]
    channel: OtaRelease["channel"]
    runtimeVersion: OtaRelease["runtimeVersion"]
    platform: OtaPlatform
  },
) {
  return kv.get<T>(
    KV_KEYS.latest(input.product, input.channel, input.runtimeVersion, input.platform),
    "json",
  )
}

export async function putReleaseRecord<T>(
  kv: KVNamespace,
  product: OtaRelease["product"],
  releaseVersion: OtaRelease["releaseVersion"],
  value: T,
) {
  await kv.put(KV_KEYS.release(product, releaseVersion), JSON.stringify(value))
}
