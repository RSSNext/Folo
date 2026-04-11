import { describe, expect, it } from "vitest"

describe("resolveMobileReleaseConfig", () => {
  it("defaults to store builds when release.json mode is store", async () => {
    const { resolveMobileReleaseConfig } = await import("./resolve-mobile-release-config.mjs")

    expect(
      resolveMobileReleaseConfig({
        releaseVersion: "v0.4.2",
        releaseConfig: {
          version: "0.4.2",
          mode: "store",
          runtimeVersion: null,
          channel: null,
          storeRequired: false,
          message: null,
        },
      }),
    ).toEqual({
      triggerStoreBuilds: true,
      triggerOtaPublish: false,
      releaseKind: null,
      runtimeVersion: null,
      channel: null,
      storeRequired: null,
      policyMessage: null,
      releaseVersion: "0.4.2",
    })
  })

  it("triggers OTA publish only for ota mode", async () => {
    const { resolveMobileReleaseConfig } = await import("./resolve-mobile-release-config.mjs")

    expect(
      resolveMobileReleaseConfig({
        releaseVersion: "v0.4.2",
        releaseConfig: {
          version: "0.4.2",
          mode: "ota",
          runtimeVersion: "0.4.1",
          channel: "production",
          storeRequired: false,
          message: null,
        },
      }),
    ).toEqual({
      triggerStoreBuilds: false,
      triggerOtaPublish: true,
      releaseKind: "ota",
      runtimeVersion: "0.4.1",
      channel: "production",
      storeRequired: "false",
      policyMessage: "",
      releaseVersion: "0.4.2",
    })
  })

  it("triggers metadata-only publish for store-policy mode", async () => {
    const { resolveMobileReleaseConfig } = await import("./resolve-mobile-release-config.mjs")

    expect(
      resolveMobileReleaseConfig({
        releaseVersion: "v0.4.3",
        releaseConfig: {
          version: "0.4.3",
          mode: "store-policy",
          runtimeVersion: "0.4.3",
          channel: "production",
          storeRequired: true,
          message: "Install 0.4.3 from the store.",
        },
      }),
    ).toEqual({
      triggerStoreBuilds: false,
      triggerOtaPublish: true,
      releaseKind: "store",
      runtimeVersion: "0.4.3",
      channel: "production",
      storeRequired: "true",
      policyMessage: "Install 0.4.3 from the store.",
      releaseVersion: "0.4.3",
    })
  })

  it("rejects a release config that does not match the release version", async () => {
    const { resolveMobileReleaseConfig } = await import("./resolve-mobile-release-config.mjs")

    expect(() =>
      resolveMobileReleaseConfig({
        releaseVersion: "v0.4.4",
        releaseConfig: {
          version: "0.4.3",
          mode: "store",
          runtimeVersion: null,
          channel: null,
          storeRequired: false,
          message: null,
        },
      }),
    ).toThrow(/does not match release version/i)
  })
})
