import { describe, expect, it } from "vitest"

import type { DesktopOtaRelease } from "../lib/schema"
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
    }) as DesktopOtaRelease

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
    }) as DesktopOtaRelease

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

  it("accepts desktop schemaVersion 2 ota metadata", () => {
    const parsed = otaReleaseSchema.parse({
      schemaVersion: 2,
      product: "desktop",
      channel: "stable",
      releaseVersion: "1.5.1",
      releaseKind: "ota",
      runtimeVersion: "1.5.0",
      publishedAt: "2026-04-11T10:00:00Z",
      git: {
        tag: "desktop/v1.5.1",
        commit: "abcdef1234567890",
      },
      policy: {
        required: false,
        minSupportedBinaryVersion: "1.5.0",
        message: null,
        distributions: {
          direct: {
            downloadUrl: "https://ota.folo.is/Folo-1.5.1-macos.dmg",
          },
        },
      },
      desktop: {
        renderer: {
          version: "1.5.1",
          commit: "abcdef1234567890",
          launchAsset: {
            path: "renderer/custom-renderer.tar.gz",
            sha256: "a".repeat(64),
            contentType: "application/gzip",
          },
          assets: [
            {
              path: "renderer/manifest.yml",
              sha256: "b".repeat(64),
              contentType: "text/yaml",
            },
          ],
        },
        app: {
          platforms: {
            windows: {
              platform: "windows-x64",
              releaseDate: "2026-04-11T10:00:00Z",
              manifest: {
                name: "latest.yml",
                downloadUrl: "https://ota.folo.is/latest.yml",
              },
              files: [
                {
                  filename: "Folo-1.5.1-windows-x64.exe",
                  sha512: "c".repeat(88),
                  size: 123456,
                  downloadUrl: "https://ota.folo.is/Folo-1.5.1-windows-x64.exe",
                },
              ],
            },
          },
        },
      },
    }) as DesktopOtaRelease

    expect(parsed.releaseKind).toBe("ota")
    expect(parsed.product).toBe("desktop")
    expect(parsed.desktop.renderer?.version).toBe("1.5.1")
    expect(parsed.platforms.windows?.launchAsset.path).toBe("renderer/custom-renderer.tar.gz")
  })

  it("aliases legacy desktop store metadata to binary", () => {
    const parsed = otaReleaseSchema.parse({
      schemaVersion: 2,
      product: "desktop",
      channel: "stable",
      releaseVersion: "1.5.1",
      releaseKind: "store",
      runtimeVersion: null,
      publishedAt: "2026-04-11T10:00:00Z",
      git: {
        tag: "desktop/v1.5.1",
        commit: "abcdef1234567890",
      },
      policy: {
        required: true,
        minSupportedBinaryVersion: "1.5.0",
        message: "Install the latest desktop app.",
        distributions: {
          mas: {
            storeUrl: "https://apps.apple.com/app/id123456789",
          },
        },
      },
      desktop: {
        renderer: null,
        app: null,
      },
    }) as DesktopOtaRelease

    expect(parsed.releaseKind).toBe("binary")
    expect(parsed.policy.distributions.mas?.storeUrl).toContain("apps.apple.com")
    expect(parsed.platforms).toEqual({})
  })

  it("rejects schemaVersion 1 desktop metadata", () => {
    const result = otaReleaseSchema.safeParse({
      schemaVersion: 1,
      product: "desktop",
      channel: "stable",
      releaseVersion: "1.5.1",
      releaseKind: "ota",
      runtimeVersion: "1.5.0",
      publishedAt: "2026-04-11T10:00:00Z",
      git: {
        tag: "desktop/v1.5.1",
        commit: "abcdef1234567890",
      },
      policy: {
        storeRequired: false,
        minSupportedBinaryVersion: "1.5.0",
        message: null,
      },
      platforms: {},
    })

    expect(result.success).toBe(false)
  })
})
