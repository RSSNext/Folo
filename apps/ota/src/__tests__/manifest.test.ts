import { createVerify, generateKeyPairSync } from "node:crypto"

import { describe, expect, it, vi } from "vitest"

import type { Env } from "../env"
import otaWorker from "../index"
import { KV_KEYS } from "../lib/constants"
import { buildManifest } from "../lib/manifest"
import type { DesktopOtaRelease, MobileOtaRelease } from "../lib/schema"

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
      } satisfies MobileOtaRelease,
      {
        origin: "https://ota.folo.is",
        platform: "ios",
      },
    )

    expect(manifest.launchAsset.url).toBe(
      "https://ota.folo.is/assets/mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js",
    )
    expect(manifest.launchAsset.key).toBe("ios-main")
    expect(manifest.launchAsset.hash).toBe("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo")
    expect(manifest.launchAsset.fileExtension).toBe(".js")
    expect(manifest.assets[0]?.url).toBe(
      "https://ota.folo.is/assets/mobile/production/0.4.1/0.4.2/ios/assets/one.png",
    )
    expect(manifest.assets[0]?.key).toBe("one")
    expect(manifest.assets[0]?.hash).toBe("u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7s")
    expect(manifest.assets[0]?.fileExtension).toBe(".png")
  })

  it("uses a deterministic id when updateId is absent", () => {
    const release = {
      ...createRelease({
        product: "mobile",
        git: { tag: "mobile/v0.4.2", commit: "abcdef1234567890" },
      }),
    }

    delete (release as Partial<MobileOtaRelease>).updateId

    const first = buildManifest(release, {
      origin: "https://ota.folo.is",
      platform: "ios",
    })
    const second = buildManifest(release, {
      origin: "https://ota.folo.is",
      platform: "ios",
    })

    expect(first.id).toBe(second.id)
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

  it("returns 400 when expo-runtime-version is invalid", async () => {
    const response = await fetchWorker("/manifest", {
      headers: {
        "expo-platform": "ios",
        "expo-runtime-version": "0.4",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid expo-runtime-version header",
    })
  })

  it("rejects legacy query-based desktop manifest requests", async () => {
    const response = await fetchWorker("/manifest?product=desktop", {
      headers: {
        "expo-platform": "ios",
        "expo-runtime-version": "0.4.1",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid product query parameter",
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

  it("fails closed when the latest pointer record is malformed", async () => {
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
          [KV_KEYS.latest("mobile", "production", "0.4.1", "ios"), { releaseVersion: "latest" }],
        ]),
      },
    )

    expect(response.status).toBe(204)
  })

  it("fails closed when the loaded release body version does not match the pointer", async () => {
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
          [
            KV_KEYS.release("mobile", "0.4.2"),
            createRelease({
              releaseVersion: "0.4.3",
              git: {
                tag: "mobile/v0.4.3",
                commit: "bcdef1234567890a",
              },
            }),
          ],
        ]),
      },
    )

    expect(response.status).toBe(204)
  })

  it("signs manifest responses when expo-expect-signature is provided", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: {
        format: "pem",
        type: "pkcs8",
      },
      publicKeyEncoding: {
        format: "pem",
        type: "spki",
      },
    })
    const response = await fetchWorker(
      "/manifest",
      {
        headers: {
          "expo-platform": "ios",
          "expo-runtime-version": "0.4.1",
          "expo-expect-signature": 'sig, keyid="main", alg="rsa-v1_5-sha256"',
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [KV_KEYS.latest("mobile", "production", "0.4.1", "ios"), { releaseVersion: "0.4.2" }],
          [KV_KEYS.release("mobile", "0.4.2"), createRelease()],
        ]),
        otaCodeSigningPrivateKey: privateKey,
      },
    )

    expect(response.status).toBe(200)

    const manifestBody = await response.text()
    const signatureHeader = response.headers.get("expo-signature")

    expect(signatureHeader).toContain('keyid="main"')
    expect(signatureHeader).toContain('alg="rsa-v1_5-sha256"')

    const signatureMatch = signatureHeader?.match(/sig="([^"]+)"/)
    expect(signatureMatch?.[1]).toBeTruthy()

    const verifier = createVerify("RSA-SHA256")
    verifier.update(manifestBody, "utf8")
    verifier.end()

    expect(verifier.verify(publicKey, signatureMatch![1]!, "base64")).toBe(true)
  })

  it("returns 500 when code signing is requested but the Worker is not configured", async () => {
    const response = await fetchWorker(
      "/manifest",
      {
        headers: {
          "expo-platform": "ios",
          "expo-runtime-version": "0.4.1",
          "expo-expect-signature": 'sig, keyid="main", alg="rsa-v1_5-sha256"',
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [KV_KEYS.latest("mobile", "production", "0.4.1", "ios"), { releaseVersion: "0.4.2" }],
          [KV_KEYS.release("mobile", "0.4.2"), createRelease()],
        ]),
      },
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: "OTA code signing is not configured",
    })
  })

  it("returns renderer and app payloads for desktop direct builds", async () => {
    const response = await fetchWorker(
      "/manifest",
      {
        headers: {
          "x-app-platform": "desktop/windows/exe",
          "x-app-version": "1.5.0",
          "x-app-runtime-version": "1.5.0",
          "x-app-renderer-version": "1.5.0",
          "x-app-channel": "stable",
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [KV_KEYS.latest("desktop", "stable", "1.5.0", "windows"), { releaseVersion: "1.5.1" }],
          [KV_KEYS.release("desktop", "1.5.1"), createDesktopRelease()],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      product: "desktop",
      channel: "stable",
      runtimeVersion: "1.5.0",
      renderer: {
        releaseVersion: "1.5.1",
        version: "1.5.1",
        commit: "abcdef1234567890",
      },
      app: {
        platform: "windows-x64",
        version: "1.5.1",
        manifest: {
          name: "latest.yml",
        },
      },
    })
  })

  it("returns only renderer for desktop store distributions", async () => {
    const response = await fetchWorker(
      "/manifest",
      {
        headers: {
          "x-app-platform": "desktop/macos/mas",
          "x-app-version": "1.5.0",
          "x-app-runtime-version": "1.5.0",
          "x-app-renderer-version": "1.5.0",
          "x-app-channel": "stable",
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [KV_KEYS.latest("desktop", "stable", "1.5.0", "macos"), { releaseVersion: "1.5.1" }],
          [KV_KEYS.release("desktop", "1.5.1"), createDesktopRelease()],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      product: "desktop",
      renderer: {
        releaseVersion: "1.5.1",
        version: "1.5.1",
      },
      app: null,
    })
  })

  it("never returns a direct app payload for desktop mss distributions", async () => {
    const response = await fetchWorker(
      "/manifest",
      {
        headers: {
          "x-app-platform": "desktop/windows/ms",
          "x-app-version": "1.5.0",
          "x-app-runtime-version": "1.5.0",
          "x-app-renderer-version": "1.5.0",
          "x-app-channel": "stable",
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [KV_KEYS.latest("desktop", "stable", "1.5.0", "windows"), { releaseVersion: "1.5.1" }],
          [KV_KEYS.release("desktop", "1.5.1"), createDesktopRelease()],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      product: "desktop",
      renderer: {
        version: "1.5.1",
      },
      app: null,
    })
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

  it("rejects invalid installedBinaryVersion", async () => {
    const response = await fetchWorker(
      "/policy?product=mobile&channel=production&installedBinaryVersion=0.4",
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid installedBinaryVersion query parameter",
    })
  })
})

function createRelease(overrides: Partial<MobileOtaRelease> = {}): MobileOtaRelease {
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

function createDesktopRelease(overrides: Partial<DesktopOtaRelease> = {}): DesktopOtaRelease {
  return {
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
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
        },
        mas: {
          storeUrl: "https://apps.apple.com/app/id123456789",
        },
        mss: {
          storeUrl: "ms-windows-store://pdp/?ProductId=9NBLGGH12345",
        },
      },
    },
    desktop: {
      renderer: {
        version: "1.5.1",
        commit: "abcdef1234567890",
        manifest: {
          name: "manifest.yml",
          downloadUrl:
            "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/manifest.yml",
        },
        launchAsset: {
          path: "renderer/custom-renderer.tar.gz",
          sha256: "a".repeat(64),
          contentType: "application/gzip",
        },
        assets: [],
      },
      app: {
        platforms: {
          macos: {
            platform: "darwin",
            releaseDate: "2026-04-11T10:00:00Z",
            manifest: {
              name: "latest-mac.yml",
              path: "latest-mac.yml",
              downloadUrl:
                "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/latest-mac.yml",
            },
            files: [
              {
                filename: "Folo-1.5.1-mac.zip",
                sha512: "c".repeat(88),
                size: 543210,
                downloadUrl:
                  "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/Folo-1.5.1-mac.zip",
              },
            ],
          },
          windows: {
            platform: "windows-x64",
            releaseDate: "2026-04-11T10:00:00Z",
            manifest: {
              name: "latest.yml",
              path: "latest.yml",
              downloadUrl:
                "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/latest.yml",
            },
            files: [
              {
                filename: "Folo-1.5.1-windows-x64.exe",
                sha512: "d".repeat(88),
                size: 654321,
                downloadUrl:
                  "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/Folo-1.5.1-windows-x64.exe",
              },
            ],
          },
          linux: {
            platform: "linux-x64",
            releaseDate: "2026-04-11T10:00:00Z",
            manifest: {
              name: "latest-linux.yml",
              path: "latest-linux.yml",
              downloadUrl:
                "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/latest-linux.yml",
            },
            files: [
              {
                filename: "Folo-1.5.1.AppImage",
                sha512: "e".repeat(88),
                size: 765432,
                downloadUrl:
                  "https://github.com/RSSNext/Folo/releases/download/desktop/v1.5.1/Folo-1.5.1.AppImage",
              },
            ],
          },
        },
      },
    },
    ...overrides,
  } as DesktopOtaRelease
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
    otaCodeSigningPrivateKey?: string
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
  otaCodeSigningPrivateKey?: string
}): Env {
  return {
    OTA_KV: createKvNamespace(options?.kvEntries),
    OTA_BUCKET: createR2Bucket(options?.bucketEntries),
    GITHUB_OWNER: "",
    GITHUB_REPO: "",
    GITHUB_TOKEN: "",
    OTA_SYNC_TOKEN: "",
    OTA_SYNC_TOKEN_HEADER: "x-ota-sync-token",
    OTA_CODE_SIGNING_PRIVATE_KEY: options?.otaCodeSigningPrivateKey,
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
