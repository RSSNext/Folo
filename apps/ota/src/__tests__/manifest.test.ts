import { describe, expect, it } from "vitest"

import { buildManifest } from "../lib/manifest"
import type { OtaRelease } from "../lib/schema"

describe("buildManifest", () => {
  it("rewrites launch asset and asset URLs to Worker-served asset routes", () => {
    const manifest = buildManifest(
      {
        schemaVersion: 1,
        product: "mobile",
        channel: "production",
        releaseVersion: "0.4.2",
        releaseKind: "ota",
        runtimeVersion: "0.4.1",
        publishedAt: "2026-04-10T12:00:00Z",
        git: { tag: "mobile/v0.4.2", commit: "abcdef1234567890" },
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
            assets: [
              {
                path: "assets/one.png",
                sha256: "b".repeat(64),
                contentType: "image/png",
              },
            ],
          },
        },
      } satisfies OtaRelease,
      {
        origin: "https://ota.folo.is",
        platform: "ios",
      },
    )

    expect(manifest.launchAsset.url).toBe(
      "https://ota.folo.is/assets/mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js",
    )
    expect(manifest.assets[0]?.url).toBe(
      "https://ota.folo.is/assets/mobile/production/0.4.1/0.4.2/ios/assets/one.png",
    )
  })
})
