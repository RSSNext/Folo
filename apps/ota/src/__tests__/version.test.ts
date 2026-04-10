import { describe, expect, it } from "vitest"

import type { OtaRelease } from "../lib/schema"
import { compareSemver, selectLatestCompatibleRelease } from "../lib/version"

function createRelease(overrides: Partial<OtaRelease> = {}): OtaRelease {
  return {
    schemaVersion: 1,
    product: "mobile",
    channel: "production",
    releaseVersion: "0.4.2",
    releaseKind: "ota",
    runtimeVersion: "0.4.1",
    publishedAt: "2026-04-10T12:00:00Z",
    git: {
      tag: "mobile/v0.4.2",
      commit: "abcdef1234567890",
    },
    policy: {
      storeRequired: false,
      minSupportedBinaryVersion: "0.4.1",
      message: null,
    },
    platforms: {
      ios: {
        launchAsset: {
          path: "bundles/ios-main.js",
          sha256: "a".repeat(64),
          contentType: "application/javascript",
        },
        assets: [],
      },
    },
    ...overrides,
  }
}

describe("compareSemver", () => {
  it("orders plain x.y.z versions numerically", () => {
    expect(compareSemver("0.4.10", "0.4.2")).toBeGreaterThan(0)
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0)
    expect(compareSemver("0.4.2", "0.5.0")).toBeLessThan(0)
  })
})

describe("selectLatestCompatibleRelease", () => {
  it("selects the highest OTA release for the same runtime", () => {
    const result = selectLatestCompatibleRelease(
      [
        createRelease({
          releaseVersion: "0.4.2",
          git: {
            tag: "mobile/v0.4.2",
            commit: "abcdef1234567890",
          },
        }),
        createRelease({
          releaseVersion: "0.4.4",
          runtimeVersion: "0.4.3",
          git: {
            tag: "mobile/v0.4.4",
            commit: "cdef1234567890ab",
          },
        }),
      ],
      {
        product: "mobile",
        channel: "production",
        runtimeVersion: "0.4.1",
        platform: "ios",
      },
    )

    expect(result?.releaseVersion).toBe("0.4.2")
  })
})
