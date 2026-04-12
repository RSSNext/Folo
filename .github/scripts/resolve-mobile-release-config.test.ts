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
        },
      }),
    ).toEqual({
      triggerStoreBuilds: true,
      triggerOtaPublish: false,
      runtimeVersion: null,
      channel: null,
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
        },
      }),
    ).toEqual({
      triggerStoreBuilds: false,
      triggerOtaPublish: true,
      runtimeVersion: "0.4.1",
      channel: "production",
      releaseVersion: "0.4.2",
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
        },
      }),
    ).toThrow(/does not match release version/i)
  })
})
