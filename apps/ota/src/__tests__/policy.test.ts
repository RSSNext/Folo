import { describe, expect, it } from "vitest"

import { evaluateStorePolicy } from "../lib/policy"
import type { OtaRelease } from "../lib/schema"

function createStoreRelease(
  overrides: Partial<
    Pick<OtaRelease, "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy">
  > = {},
): Pick<OtaRelease, "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy"> {
  return {
    releaseVersion: "0.4.3",
    releaseKind: "store",
    runtimeVersion: "0.4.3",
    policy: {
      storeRequired: true,
      minSupportedBinaryVersion: "0.4.0",
      message: "Please update from the store.",
    },
    ...overrides,
  }
}

describe("evaluateStorePolicy", () => {
  it("returns none when there is no release to evaluate", () => {
    const policy = evaluateStorePolicy(null, {
      installedBinaryVersion: "0.4.1",
    })

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })

  it("returns none for non-store releases", () => {
    const policy = evaluateStorePolicy(
      createStoreRelease({
        releaseKind: "ota",
      }),
      {
        installedBinaryVersion: "0.4.1",
      },
    )

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })

  it("requires a store update when a store release is newer than the installed binary", () => {
    const policy = evaluateStorePolicy(createStoreRelease(), {
      installedBinaryVersion: "0.4.2",
    })

    expect(policy.action).toBe("block")
    expect(policy.targetVersion).toBe("0.4.3")
  })

  it("prompts when a newer store release is available but not required", () => {
    const policy = evaluateStorePolicy(
      createStoreRelease({
        policy: {
          storeRequired: false,
          minSupportedBinaryVersion: "0.4.0",
          message: "An update is available.",
        },
      }),
      {
        installedBinaryVersion: "0.4.2",
      },
    )

    expect(policy).toEqual({
      action: "prompt",
      targetVersion: "0.4.3",
      message: "An update is available.",
    })
  })

  it("blocks when the installed binary is below the minimum supported version", () => {
    const policy = evaluateStorePolicy(
      createStoreRelease({
        policy: {
          storeRequired: false,
          minSupportedBinaryVersion: "0.4.2",
          message: "Please update from the store.",
        },
      }),
      {
        installedBinaryVersion: "0.4.1",
      },
    )

    expect(policy).toEqual({
      action: "block",
      targetVersion: "0.4.3",
      message: "Please update from the store.",
    })
  })

  it("returns none when the installed binary is already up to date", () => {
    const policy = evaluateStorePolicy(createStoreRelease(), {
      installedBinaryVersion: "0.4.3",
    })

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })
})
