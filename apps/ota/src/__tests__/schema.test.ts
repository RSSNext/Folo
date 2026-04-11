import { describe, expect, it } from "vitest"

import { otaReleaseSchema } from "../lib/schema"

describe("otaReleaseSchema", () => {
  it("accepts a plain x.y.z release version and a binary-compatible runtime version", () => {
    const parsed = otaReleaseSchema.parse({
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
    })

    expect(parsed.releaseVersion).toBe("0.4.2")
    expect(parsed.runtimeVersion).toBe("0.4.1")
    expect(Object.keys(parsed.platforms)).toEqual(["ios"])
  })

  it("rejects ota metadata with no platforms", () => {
    expect(() =>
      otaReleaseSchema.parse({
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
        platforms: {},
      }),
    ).toThrow("At least one platform must be provided")
  })

  it("accepts store metadata with no platforms", () => {
    const parsed = otaReleaseSchema.parse({
      schemaVersion: 1,
      product: "mobile",
      channel: "production",
      releaseVersion: "0.4.3",
      releaseKind: "store",
      runtimeVersion: "0.4.3",
      publishedAt: "2026-04-10T12:00:00Z",
      git: {
        tag: "mobile/v0.4.3",
        commit: "abcdef1234567890",
      },
      policy: {
        storeRequired: true,
        minSupportedBinaryVersion: "0.4.3",
        message: "Install 0.4.3 from the store.",
      },
      platforms: {},
    })

    expect(parsed.releaseKind).toBe("store")
    expect(parsed.platforms).toEqual({})
  })

  it("rejects metadata when platform keys exist without a real payload", () => {
    const result = otaReleaseSchema.safeParse({
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
        ios: undefined,
      },
    })

    expect(result.success).toBe(false)
  })
})
