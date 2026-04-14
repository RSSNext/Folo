import type { DesktopDistribution, OtaRelease } from "./schema"
import { compareSemver } from "./version"

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
  latestStoreVersion: OtaRelease["releaseVersion"] | null,
  input: {
    installedBinaryVersion: OtaRelease["releaseVersion"]
  },
): StorePolicyEvaluation {
  if (!latestStoreVersion) {
    return { action: "none", targetVersion: null, message: null }
  }

  if (compareSemver(latestStoreVersion, input.installedBinaryVersion) <= 0) {
    return { action: "none", targetVersion: null, message: null }
  }

  return {
    action: "prompt",
    targetVersion: latestStoreVersion,
    message: null,
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

export function evaluateBinaryPolicy(input: {
  installedBinaryVersion: OtaRelease["releaseVersion"]
  distribution: DesktopDistribution
  latestStoreVersion: OtaRelease["releaseVersion"] | null
  storeUrl: string | null
}): BinaryPolicyEvaluation {
  if (input.distribution === "direct" || !input.latestStoreVersion) {
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

  if (compareSemver(input.latestStoreVersion, input.installedBinaryVersion) <= 0) {
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
    action: "prompt",
    targetVersion: input.latestStoreVersion,
    message: null,
    distribution: input.distribution,
    downloadUrl: null,
    storeUrl: input.storeUrl,
    publishedAt: null,
  }
}
