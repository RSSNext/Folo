import type { OtaRelease } from "./schema"
import { compareSemver } from "./version"

type StoreReleasePolicyInput = Pick<
  OtaRelease,
  "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy"
>

type StorePolicyEvaluation =
  | {
      action: "none"
      targetVersion: null
      message: null
    }
  | {
      action: "block" | "prompt"
      targetVersion: OtaRelease["releaseVersion"]
      message: string | null
    }

export function evaluateStorePolicy(
  latestStoreRelease: StoreReleasePolicyInput | null,
  input: {
    installedBinaryVersion: OtaRelease["releaseVersion"]
  },
): StorePolicyEvaluation {
  if (!latestStoreRelease || latestStoreRelease.releaseKind !== "store") {
    return { action: "none", targetVersion: null, message: null }
  }

  if (compareSemver(latestStoreRelease.releaseVersion, input.installedBinaryVersion) <= 0) {
    return { action: "none", targetVersion: null, message: null }
  }

  return {
    action: latestStoreRelease.policy.storeRequired ? "block" : "prompt",
    targetVersion: latestStoreRelease.releaseVersion,
    message: latestStoreRelease.policy.message,
  }
}
