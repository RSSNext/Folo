import { describe, expect, it } from "vitest"

describe("buildOtaMetadata", () => {
  it("preserves releaseVersion, runtimeVersion, and scoped git tag", async () => {
    const { buildOtaMetadata } = await import("./build-ota-release.mjs")

    const result = await buildOtaMetadata({
      product: "mobile",
      channel: "production",
      releaseVersion: "0.4.2",
      releaseKind: "ota",
      runtimeVersion: "0.4.1",
      gitTag: "mobile/v0.4.2",
      gitCommit: "abcdef1234567890",
      publishedAt: "2026-04-10T12:00:00.000Z",
      policy: {
        storeRequired: false,
        minSupportedBinaryVersion: "0.4.1",
        message: null,
      },
      metadata: {
        fileMetadata: {
          ios: {
            bundle: "_expo/static/js/ios/main.hbc",
            assets: [],
          },
          android: {
            bundle: "_expo/static/js/android/main.hbc",
            assets: [],
          },
        },
      },
      resolveAsset: async (assetPath: string) => ({
        path: assetPath,
        sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
        contentType: "application/octet-stream",
      }),
    })

    expect(result.releaseVersion).toBe("0.4.2")
    expect(result.runtimeVersion).toBe("0.4.1")
    expect(result.git.tag).toBe("mobile/v0.4.2")
  })
})
