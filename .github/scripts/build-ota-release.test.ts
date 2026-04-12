import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"
import { afterEach, describe, expect, it } from "vitest"

type InputAsset = string | { path: string; ext?: string }

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
  delete process.env.OTA_RELEASE_KIND
  delete process.env.OTA_RELEASE_VERSION
  delete process.env.OTA_RUNTIME_VERSION
  delete process.env.OTA_CHANNEL
  delete process.env.OTA_PRODUCT
  delete process.env.OTA_GIT_TAG
  delete process.env.OTA_GIT_COMMIT
  delete process.env.OTA_PUBLISHED_AT
  delete process.env.OTA_STORE_REQUIRED
  delete process.env.GITHUB_REPOSITORY
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
      resolveAsset: async (asset: InputAsset) => {
        const assetPath = typeof asset === "string" ? asset : asset.path

        return {
          path: assetPath,
          sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
          contentType: "application/octet-stream",
        }
      },
    })

    expect(result.releaseVersion).toBe("0.4.2")
    expect(result.runtimeVersion).toBe("0.4.1")
    expect(result.git.tag).toBe("mobile/v0.4.2")
    expect(result.updateId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
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
        resolveAsset: async (asset: InputAsset) => {
          const assetPath = typeof asset === "string" ? asset : asset.path

          return {
            path: assetPath,
            sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
            contentType: "application/octet-stream",
          }
        },
      }),
    ).rejects.toThrow(/android/i)
  })

  it("fails when a platform assets array is missing from export metadata", async () => {
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
            },
            android: {
              bundle: "_expo/static/js/android/main.hbc",
              assets: [],
            },
          },
        },
        resolveAsset: async (asset: InputAsset) => {
          const assetPath = typeof asset === "string" ? asset : asset.path

          return {
            path: assetPath,
            sha256: `${assetPath}-sha256`.padEnd(64, "0").slice(0, 64),
            contentType: "application/octet-stream",
          }
        },
      }),
    ).rejects.toThrow(/ios.*assets/i)
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
  it("builds metadata-only assets for store releases without Expo export output", async () => {
    const { buildReleaseAssets } = await import("./build-ota-release.mjs")

    const projectDir = await mkdtemp(join(tmpdir(), "build-ota-release-store-test-"))
    tempDirs.push(projectDir)

    await writeFile(
      join(projectDir, "package.json"),
      JSON.stringify({ name: "@follow/mobile-test", version: "0.4.3" }),
      "utf8",
    )

    process.env.OTA_RELEASE_KIND = "store"
    process.env.OTA_RELEASE_VERSION = "0.4.3"
    process.env.OTA_RUNTIME_VERSION = "0.4.3"
    process.env.OTA_CHANNEL = "production"
    process.env.OTA_STORE_REQUIRED = "true"

    const result = await buildReleaseAssets({ projectDir })

    expect(result.otaMetadata.releaseKind).toBe("store")
    expect(result.otaMetadata.policy.storeRequired).toBe(true)
    expect(result.otaMetadata.platforms).toEqual({})
    expect(result.archivePath).toBeNull()
  })

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

describe("buildDesktopReleaseAssets", () => {
  it("builds schemaVersion 2 desktop build metadata with direct app payloads only", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "build",
        runtimeVersion: null,
        channel: null,
        distributions: [],
        required: false,
        message: null,
      },
      manifests: [
        {
          relativeDir: join("out", "make", "squirrel.windows", "x64"),
          manifestName: "latest.yml",
          contents: `
version: 1.5.1
files:
  - url: Folo-1.5.1-windows-x64.exe
    sha512: ${"a".repeat(88)}
    size: 123456
releaseDate: 2026-04-11T10:00:00.000Z
`,
        },
      ],
    })

    const result = await buildDesktopReleaseAssets({
      projectDir,
      owner: "RSSNext",
      repo: "Folo",
    })

    expect(result.otaMetadata.schemaVersion).toBe(2)
    expect(result.otaMetadata.product).toBe("desktop")
    expect(result.otaMetadata.releaseKind).toBe("binary")
    expect(result.otaMetadata.runtimeVersion).toBeNull()
    expect(result.otaMetadata.channel).toBeNull()
    expect(result.otaMetadata.desktop.renderer).toBeNull()
    expect(result.otaMetadata.desktop.app.platforms.windows).toEqual(
      expect.objectContaining({
        platform: "windows-x64",
        releaseDate: "2026-04-11T10:00:00.000Z",
        manifest: {
          name: "latest.yml",
          path: "latest.yml",
          downloadUrl: expect.stringContaining("/desktop/v1.5.1/latest.yml"),
        },
        files: [
          expect.objectContaining({
            filename: "Folo-1.5.1-windows-x64.exe",
            sha512: "a".repeat(88),
            size: 123456,
            downloadUrl: expect.stringContaining("/desktop/v1.5.1/Folo-1.5.1-windows-x64.exe"),
          }),
        ],
      }),
    )
    expect(result.archivePath).toBeNull()

    const written = JSON.parse(await readFile(result.outputPath, "utf8"))
    expect(written.schemaVersion).toBe(2)
    expect(written.desktop.renderer).toBeNull()
  })

  it("builds schemaVersion 2 desktop ota metadata with renderer and direct app payloads", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "ota",
        runtimeVersion: "1.5.0",
        channel: "stable",
        distributions: ["direct"],
        required: false,
        message: null,
      },
      rendererArchiveContents: "renderer archive",
      rendererManifestContents: `
version: 1.5.1
hash: ${"b".repeat(64)}
mainHash: ${"c".repeat(40)}
commit: abcdef1234567890
filename: custom-renderer.tar.gz
`,
      manifests: [
        {
          relativeDir: join("out", "make", "squirrel.windows", "x64"),
          manifestName: "latest.yml",
          contents: `
version: 1.5.1
files:
  - url: Folo-1.5.1-windows-x64.exe
    sha512: ${"d".repeat(88)}
    size: 654321
releaseDate: 2026-04-11T10:00:00.000Z
`,
        },
      ],
    })

    const result = await buildDesktopReleaseAssets({
      projectDir,
      owner: "RSSNext",
      repo: "Folo",
    })

    expect(result.otaMetadata.schemaVersion).toBe(2)
    expect(result.otaMetadata.releaseKind).toBe("ota")
    expect(result.otaMetadata.runtimeVersion).toBe("1.5.0")
    expect(result.otaMetadata.channel).toBe("stable")
    expect(result.otaMetadata.desktop.renderer).toEqual(
      expect.objectContaining({
        version: "1.5.1",
        commit: "abcdef1234567890",
        manifest: {
          name: "manifest.yml",
          downloadUrl:
            "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/manifest.yml",
        },
        launchAsset: expect.objectContaining({
          path: "renderer/custom-renderer.tar.gz",
          contentType: "application/gzip",
        }),
      }),
    )
    expect(result.otaMetadata.desktop.renderer.launchAsset.sha256).toHaveLength(64)
    expect(result.otaMetadata.desktop.app.platforms.windows.files[0]?.downloadUrl).toContain(
      "/desktop/v1.5.1/Folo-1.5.1-windows-x64.exe",
    )
    expect(result.archivePath).not.toBeNull()
  })

  it("builds desktop binary-policy metadata without dist.tar.zst", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "binary-policy",
        runtimeVersion: null,
        channel: "stable",
        distributions: ["mas", "mss"],
        required: true,
        message: "Install the latest desktop app.",
      },
    })

    const result = await buildDesktopReleaseAssets({
      projectDir,
      owner: "RSSNext",
      repo: "Folo",
    })

    expect(result.otaMetadata.schemaVersion).toBe(2)
    expect(result.otaMetadata.releaseKind).toBe("binary")
    expect(result.otaMetadata.runtimeVersion).toBeNull()
    expect(result.otaMetadata.channel).toBe("stable")
    expect(result.otaMetadata.policy).toEqual({
      required: true,
      minSupportedBinaryVersion: "1.5.1",
      message: "Install the latest desktop app.",
      distributions: {
        mas: {},
        mss: {},
      },
    })
    expect(result.otaMetadata.desktop).toEqual({
      renderer: null,
      app: null,
    })
    expect(result.archivePath).toBeNull()
  })

  it("keeps desktop binary-policy metadata installer-free even if manifests exist", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "binary-policy",
        runtimeVersion: null,
        channel: "stable",
        distributions: ["direct"],
        required: false,
        message: "Use the latest direct installer.",
      },
      manifests: [
        {
          relativeDir: join("out", "make", "squirrel.windows", "x64"),
          manifestName: "latest.yml",
          contents: `
version: 1.5.1
files:
  - url: Folo-1.5.1-windows-x64.exe
    sha512: ${"1".repeat(88)}
    size: 123456
releaseDate: 2026-04-11T10:00:00.000Z
`,
        },
      ],
    })

    const result = await buildDesktopReleaseAssets({
      projectDir,
      owner: "RSSNext",
      repo: "Folo",
    })

    expect(result.otaMetadata.desktop.app).toBeNull()
    expect(result.archivePath).toBeNull()
  })

  it("fails when a desktop manifest contains an invalid file entry", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "build",
        runtimeVersion: null,
        channel: null,
        distributions: [],
        required: false,
        message: null,
      },
      manifests: [
        {
          relativeDir: join("out", "make", "squirrel.windows", "x64"),
          manifestName: "latest.yml",
          contents: `
version: 1.5.1
files:
  - url: Folo-1.5.1-windows-x64.exe
    size: 123456
releaseDate: 2026-04-11T10:00:00.000Z
`,
        },
      ],
    })

    await expect(
      buildDesktopReleaseAssets({
        projectDir,
        owner: "RSSNext",
        repo: "Folo",
      }),
    ).rejects.toThrow(/invalid files\[0\] entry/i)
  })

  it("fails for build mode when direct installer manifests are missing", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "build",
        runtimeVersion: null,
        channel: null,
        distributions: [],
        required: false,
        message: null,
      },
    })

    await expect(
      buildDesktopReleaseAssets({
        projectDir,
        owner: "RSSNext",
        repo: "Folo",
      }),
    ).rejects.toThrow(/requires direct installer manifests/i)
  })

  it("fails for ota mode when direct installer manifests are missing", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "ota",
        runtimeVersion: "1.5.0",
        channel: "stable",
        distributions: ["direct"],
        required: false,
        message: null,
      },
      rendererArchiveContents: "renderer archive",
      rendererManifestContents: `
version: 1.5.1
hash: ${"2".repeat(64)}
mainHash: ${"3".repeat(40)}
commit: abcdef1234567890
filename: custom-renderer.tar.gz
`,
    })

    await expect(
      buildDesktopReleaseAssets({
        projectDir,
        owner: "RSSNext",
        repo: "Folo",
      }),
    ).rejects.toThrow(/requires direct installer manifests/i)
  })

  it("merges duplicate desktop platform manifests instead of overwriting them", async () => {
    const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
    const projectDir = await createDesktopProjectFixture({
      version: "1.5.1",
      releaseConfig: {
        version: "1.5.1",
        mode: "build",
        runtimeVersion: null,
        channel: null,
        distributions: [],
        required: false,
        message: null,
      },
      manifests: [
        {
          relativeDir: join("out", "make", "squirrel.windows", "x64"),
          manifestName: "latest.yml",
          contents: `
version: 1.5.1
files:
  - url: Folo-1.5.1-windows-x64.exe
    sha512: ${"e".repeat(88)}
    size: 123456
releaseDate: 2026-04-11T10:00:00.000Z
`,
        },
        {
          relativeDir: join("out", "make", "squirrel.windows", "arm64"),
          manifestName: "latest.yml",
          contents: `
version: 1.5.1
files:
  - url: Folo-1.5.1-windows-arm64.exe
    sha512: ${"f".repeat(88)}
    size: 234567
releaseDate: 2026-04-11T11:00:00.000Z
`,
        },
      ],
    })

    const result = await buildDesktopReleaseAssets({
      projectDir,
      owner: "RSSNext",
      repo: "Folo",
    })

    expect(result.otaMetadata.desktop.app.platforms.windows.files).toHaveLength(2)
    expect(result.otaMetadata.desktop.app.platforms.windows.releaseDate).toBe(
      "2026-04-11T11:00:00.000Z",
    )
  })
})

async function createDesktopProjectFixture(input: {
  version: string
  releaseConfig: {
    version: string
    mode: "build" | "ota" | "binary-policy"
    runtimeVersion: string | null
    channel: "stable" | "beta" | "alpha" | null
    distributions: Array<"direct" | "mas" | "mss">
    required: boolean
    message: string | null
  }
  manifests?: Array<{
    relativeDir: string
    manifestName: string
    contents: string
  }>
  rendererArchiveContents?: string
  rendererManifestContents?: string
}) {
  const projectDir = await mkdtemp(join(tmpdir(), "build-ota-release-desktop-test-"))
  tempDirs.push(projectDir)

  await writeFile(
    join(projectDir, "package.json"),
    JSON.stringify({ name: "@follow/desktop-test", version: input.version }),
    "utf8",
  )
  await writeFile(
    join(projectDir, "release.json"),
    `${JSON.stringify(input.releaseConfig, null, 2)}\n`,
    "utf8",
  )

  if (input.rendererArchiveContents != null || input.rendererManifestContents != null) {
    await mkdir(join(projectDir, "dist"), { recursive: true })
  }

  if (input.rendererArchiveContents != null) {
    await writeFile(
      join(
        projectDir,
        "dist",
        input.rendererManifestContents?.includes("custom-renderer.tar.gz")
          ? "custom-renderer.tar.gz"
          : "render-asset.tar.gz",
      ),
      input.rendererArchiveContents,
      "utf8",
    )
  }

  if (input.rendererManifestContents != null) {
    await writeFile(
      join(projectDir, "dist", "manifest.yml"),
      input.rendererManifestContents.trimStart(),
      "utf8",
    )
  }

  for (const manifest of input.manifests ?? []) {
    await mkdir(join(projectDir, manifest.relativeDir), { recursive: true })
    await writeFile(
      join(projectDir, manifest.relativeDir, manifest.manifestName),
      manifest.contents.trimStart(),
      "utf8",
    )
  }

  return projectDir
}
