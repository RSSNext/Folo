import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"
import { afterEach, describe, expect, it } from "vitest"

type InputAsset = string | { path: string; ext?: string }

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

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

  it("uses asset ext metadata when exported asset paths have no suffix", async () => {
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
            assets: [{ path: "assets/splash", ext: "png" }],
          },
          android: {
            bundle: "_expo/static/js/android/main.hbc",
            assets: [],
          },
        },
      },
      resolveAsset: async (asset: InputAsset) => {
        const assetPath = typeof asset === "string" ? asset : asset.path
        const ext = typeof asset === "string" ? undefined : asset.ext

        return {
          path: assetPath,
          sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
          contentType: ext === "png" ? "image/png" : "application/octet-stream",
        }
      },
    })

    expect(result.platforms.ios.assets).toEqual([
      expect.objectContaining({
        path: "assets/splash",
        contentType: "image/png",
      }),
    ])
  })

  it("fails when a platform bundle is missing from export metadata", async () => {
    const { buildOtaMetadata } = await import("./build-ota-release.mjs")

    await expect(
      buildOtaMetadata({
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
          },
        },
        resolveAsset: async (assetPath: string) => ({
          path: assetPath,
          sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
          contentType: "application/octet-stream",
        }),
      }),
    ).rejects.toThrow(/android/i)
  })

  it("deduplicates repeated asset entries after path normalization", async () => {
    const { buildOtaMetadata } = await import("./build-ota-release.mjs")

    const resolvedAssets: InputAsset[] = []

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
            assets: ["./assets/icon.png", { path: "assets/icon.png" }],
          },
          android: {
            bundle: "_expo/static/js/android/main.hbc",
            assets: [],
          },
        },
      },
      resolveAsset: async (asset: InputAsset) => {
        resolvedAssets.push(asset)
        const assetPath = typeof asset === "string" ? asset : asset.path

        return {
          path: assetPath,
          sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
          contentType: "image/png",
        }
      },
    })

    expect(result.platforms.ios.assets).toHaveLength(1)
    expect(
      resolvedAssets.filter((asset) => {
        const assetPath = typeof asset === "string" ? asset : asset.path

        return assetPath === "assets/icon.png"
      }),
    ).toHaveLength(1)
  })
})

describe("buildReleaseAssets", () => {
  it("includes the JSON file path when export metadata cannot be parsed", async () => {
    const { buildReleaseAssets } = await import("./build-ota-release.mjs")

    const projectDir = await mkdtemp(join(tmpdir(), "build-ota-release-test-"))
    const distDir = join(projectDir, "dist")
    const metadataPath = join(distDir, "metadata.json")
    tempDirs.push(projectDir)

    await mkdir(distDir, { recursive: true })
    await writeFile(
      join(projectDir, "package.json"),
      JSON.stringify({ name: "@follow/mobile-test", version: "0.4.2" }),
      "utf8",
    )
    await writeFile(metadataPath, "{invalid", "utf8")

    await expect(buildReleaseAssets({ projectDir })).rejects.toThrow(metadataPath)
  })
})
