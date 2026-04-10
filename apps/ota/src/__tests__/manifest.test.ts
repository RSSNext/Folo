import { describe, expect, it, vi } from "vitest"

import type { Env } from "../env"
import otaWorker from "../index"
import { KV_KEYS } from "../lib/constants"
import { buildManifest } from "../lib/manifest"
import type { OtaRelease } from "../lib/schema"

const textEncoder = new TextEncoder()

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

describe("/manifest", () => {
  it("returns 204 when no pointer exists", async () => {
    const response = await fetchWorker("/manifest", {
      headers: {
        "expo-platform": "ios",
        "expo-runtime-version": "0.4.1",
      },
    })

    expect(response.status).toBe(204)
  })

  it("returns 400 when expo-platform is missing", async () => {
    const response = await fetchWorker("/manifest", {
      headers: {
        "expo-runtime-version": "0.4.1",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Missing expo-platform header",
    })
  })

  it("does not serve a store release as OTA", async () => {
    const release = createRelease({
      releaseKind: "store",
    })
    const response = await fetchWorker(
      "/manifest",
      {
        headers: {
          "expo-platform": "ios",
          "expo-runtime-version": "0.4.1",
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [KV_KEYS.latest("mobile", "production", "0.4.1", "ios"), { releaseVersion: "0.4.2" }],
          [KV_KEYS.release("mobile", "0.4.2"), release],
        ]),
      },
    )

    expect(response.status).toBe(204)
  })
})

describe("/assets/*", () => {
  it("returns 404 when the asset is missing", async () => {
    const response = await fetchWorker(
      "/assets/mobile/production/0.4.1/0.4.2/ios/assets/missing.png",
    )

    expect(response.status).toBe(404)
    await expect(response.text()).resolves.toBe("Not found")
  })

  it("preserves stored metadata and immutable cache headers when the asset exists", async () => {
    const key = "mobile/production/0.4.1/0.4.2/ios/assets/one.png"
    const response = await fetchWorker(`/assets/${key}`, undefined, {
      bucketEntries: new Map([
        [
          key,
          {
            body: textEncoder.encode("asset"),
            headers: {
              "content-type": "image/png",
            },
          },
        ],
      ]),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/png")
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    await expect(response.text()).resolves.toBe("asset")
  })
})

describe("/policy", () => {
  it("rejects missing installedBinaryVersion", async () => {
    const response = await fetchWorker("/policy?product=mobile&channel=production")

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Missing installedBinaryVersion query parameter",
    })
  })
})

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
        assets: [
          {
            path: "assets/one.png",
            sha256: "b".repeat(64),
            contentType: "image/png",
          },
        ],
      },
    },
    ...overrides,
  }
}

async function fetchWorker(
  path: string,
  init?: RequestInit,
  options?: {
    kvEntries?: Map<string, unknown>
    bucketEntries?: Map<
      string,
      {
        body: Uint8Array
        headers?: Record<string, string>
      }
    >
  },
) {
  const response = await otaWorker.fetch(
    new Request(`https://ota.folo.is${path}`, init),
    createEnv(options),
    createExecutionContext(),
  )

  return response
}

function createEnv(options?: {
  kvEntries?: Map<string, unknown>
  bucketEntries?: Map<
    string,
    {
      body: Uint8Array
      headers?: Record<string, string>
    }
  >
}): Env {
  return {
    OTA_KV: createKvNamespace(options?.kvEntries),
    OTA_BUCKET: createR2Bucket(options?.bucketEntries),
    GITHUB_OWNER: "",
    GITHUB_REPO: "",
    GITHUB_TOKEN: "",
    OTA_SYNC_TOKEN: "",
    OTA_SYNC_TOKEN_HEADER: "x-ota-sync-token",
  }
}

function createKvNamespace(entries = new Map<string, unknown>()): KVNamespace {
  return {
    get: vi.fn(async (key: string) => entries.get(key) ?? null),
    put: vi.fn(async () => {}),
  } as unknown as KVNamespace
}

function createR2Bucket(
  entries = new Map<
    string,
    {
      body: Uint8Array
      headers?: Record<string, string>
    }
  >(),
): R2Bucket {
  return {
    get: vi.fn(async (key: string) => {
      const entry = entries.get(key)

      if (!entry) {
        return null
      }

      return {
        body: entry.body,
        writeHttpMetadata: (headers: Headers) => {
          for (const [name, value] of Object.entries(entry.headers ?? {})) {
            headers.set(name, value)
          }
        },
      }
    }),
  } as unknown as R2Bucket
}

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext
}
