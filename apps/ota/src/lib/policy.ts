import type { BinaryPolicyRecord } from "./kv"
import type { DesktopDistribution, MobileOtaRelease, OtaRelease } from "./schema"
import { compareSemver } from "./version"

type StoreReleasePolicyInput = Pick<
  MobileOtaRelease,
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

  if (
    compareSemver(
      input.installedBinaryVersion,
      latestStoreRelease.policy.minSupportedBinaryVersion,
    ) < 0
  ) {
    return {
      action: "block",
      targetVersion: latestStoreRelease.releaseVersion,
      message: latestStoreRelease.policy.message,
    }
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

type BinaryPolicyEvaluation = {
  action: "none" | "prompt" | "block"
  targetVersion: OtaRelease["releaseVersion"] | null
  message: string | null
  distribution: DesktopDistribution
  downloadUrl: string | null
  storeUrl: string | null
  publishedAt: string | null
}

export function evaluateBinaryPolicy(
  policies: {
    targeted: BinaryPolicyRecord | null
    generic: BinaryPolicyRecord | null
  },
  input: {
    installedBinaryVersion: OtaRelease["releaseVersion"]
    distribution: DesktopDistribution
  },
): BinaryPolicyEvaluation {
  const policy = policies.targeted ?? policies.generic

  if (!policy) {
    return {
      action: "none",
      targetVersion: null,
      message: null,
      distribution: input.distribution,
      downloadUrl: null,
      storeUrl: null,
      publishedAt: null,
    }
  }

  if (compareSemver(input.installedBinaryVersion, policy.minSupportedBinaryVersion) < 0) {
    return {
      action: "block",
      targetVersion: policy.releaseVersion,
      message: policy.message,
      distribution: input.distribution,
      downloadUrl: policy.downloadUrl,
      storeUrl: policy.storeUrl,
      publishedAt: policy.publishedAt,
    }
  }

  if (compareSemver(policy.releaseVersion, input.installedBinaryVersion) <= 0) {
    return {
      action: "none",
      targetVersion: null,
      message: null,
      distribution: input.distribution,
      downloadUrl: null,
      storeUrl: null,
      publishedAt: null,
    }
  }

  return {
    action: policy.required ? "block" : "prompt",
    targetVersion: policy.releaseVersion,
    message: policy.message,
    distribution: input.distribution,
    downloadUrl: policy.downloadUrl,
    storeUrl: policy.storeUrl,
    publishedAt: policy.publishedAt,
  }
}
