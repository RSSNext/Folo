import { describe, expect, it } from "vitest"

import { evaluateStorePolicy } from "../lib/policy"
import type { OtaRelease } from "../lib/schema"

describe("evaluateStorePolicy", () => {
  it("requires a store update when a store release is newer than the installed binary", () => {
    const policy = evaluateStorePolicy(
      {
        releaseVersion: "0.4.3",
        releaseKind: "store",
        runtimeVersion: "0.4.3",
        policy: {
          storeRequired: true,
          minSupportedBinaryVersion: "0.4.3",
          message: "Please update from the store.",
        },
      } satisfies Pick<OtaRelease, "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy">,
      {
        installedBinaryVersion: "0.4.1",
      },
    )

    expect(policy.action).toBe("block")
    expect(policy.targetVersion).toBe("0.4.3")
  })
})
