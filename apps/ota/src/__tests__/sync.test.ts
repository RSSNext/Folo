import tar from "tar-stream"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Env } from "../env"
import otaWorker from "../index"
import { extractMirroredFiles } from "../lib/archive"
import { KV_KEYS } from "../lib/constants"
import type { GitHubRequestError } from "../lib/github"
import { listPublishedOtaReleases } from "../lib/github"
import { IMMUTABLE_ASSET_CACHE_CONTROL, putMirroredFiles } from "../lib/r2"
import type { DesktopOtaRelease, MobileOtaRelease, OtaRelease } from "../lib/schema"
import { otaReleaseSchema } from "../lib/schema"
import { mirrorReleaseToStorage, syncGitHubReleases } from "../lib/sync"

vi.mock("fzstd", () => {
  class Decompress {
    ondata: (chunk: Uint8Array, final?: boolean) => unknown

    constructor(ondata?: (chunk: Uint8Array, final?: boolean) => unknown) {
      this.ondata = ondata ?? (() => {})
    }

    push(chunk: Uint8Array, final = false) {
      const boundary = Math.max(1, Math.ceil(chunk.length / 2))
      const firstChunk = chunk.subarray(0, boundary)
      const secondChunk = chunk.subarray(boundary)

      if (firstChunk.byteLength > 0) {
        this.ondata(firstChunk, final && secondChunk.byteLength === 0)
      }

      if (secondChunk.byteLength > 0 || final) {
        this.ondata(secondChunk, final)
      }

      return true
    }
  }

  return { Decompress }
})

const textEncoder = new TextEncoder()
const baseRelease = {
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
} as const

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("listPublishedOtaReleases", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              tag_name: "mobile/v0.4.2",
              draft: false,
              prerelease: false,
              assets: [
                {
                  name: "ota-release.json",
                  browser_download_url: "https://example.com/ota-release.json",
                },
                {
                  name: "dist.tar.zst",
                  browser_download_url: "https://example.com/dist.tar.zst",
                },
              ],
            },
          ]),
          {
            status: 200,
            headers: {
              ETag: '"etag-200"',
            },
          },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns releases that have both required assets and the response etag", async () => {
    const result = await listPublishedOtaReleases({
      owner: "RSSNext",
      repo: "Folo",
      token: "token",
      etag: null,
    })

    expect(result).toMatchObject({
      kind: "ok",
      etag: '"etag-200"',
    })

    if (result.kind !== "ok") {
      throw new Error("Expected a successful GitHub releases response")
    }

    expect(result.releases[0]?.tag).toBe("mobile/v0.4.2")
    expect(result.releases[0]?.metadataUrl).toContain("ota-release.json")
  })

  it("returns a not-modified result for 304 responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 304 }))

    vi.stubGlobal("fetch", fetchMock)

    const result = await listPublishedOtaReleases({
      owner: "RSSNext",
      repo: "Folo",
      token: "token",
      etag: '"etag-value"',
    })

    expect(result).toEqual({ kind: "not-modified" })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/RSSNext/Folo/releases",
      expect.objectContaining({
        headers: expect.objectContaining({
          "If-None-Match": '"etag-value"',
        }),
      }),
    )
  })

  it("filters out releases missing metadata assets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              tag_name: "desktop/v1.2.3",
              draft: false,
              prerelease: false,
              assets: [
                {
                  name: "dist.tar.zst",
                  browser_download_url: "https://example.com/desktop-dist.tar.zst",
                },
              ],
            },
          ]),
          { status: 200 },
        ),
      ),
    )

    const result = await listPublishedOtaReleases({
      owner: "RSSNext",
      repo: "Folo",
      token: "token",
      etag: null,
    })

    expect(result).toEqual({
      kind: "ok",
      etag: null,
      releases: [],
    })
  })

  it("includes metadata-only releases so store policy publishes can sync", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              tag_name: "mobile/v0.4.3",
              draft: false,
              prerelease: false,
              assets: [
                {
                  name: "ota-release.json",
                  browser_download_url: "https://example.com/store-ota-release.json",
                },
              ],
            },
          ]),
          { status: 200 },
        ),
      ),
    )

    const result = await listPublishedOtaReleases({
      owner: "RSSNext",
      repo: "Folo",
      token: "token",
      etag: null,
    })

    expect(result).toEqual({
      kind: "ok",
      etag: null,
      releases: [
        {
          tag: "mobile/v0.4.3",
          metadataUrl: "https://example.com/store-ota-release.json",
          archiveUrl: null,
        },
      ],
    })
  })

  it("sends a user agent header required by the GitHub releases API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
      }),
    )

    vi.stubGlobal("fetch", fetchMock)

    await listPublishedOtaReleases({
      owner: "RSSNext",
      repo: "Folo",
      token: "token",
      etag: null,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/RSSNext/Folo/releases",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.any(String),
        }),
      }),
    )
  })

  it("throws a structured error for failed requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Bad credentials" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ),
    )

    await expect(
      listPublishedOtaReleases({
        owner: "RSSNext",
        repo: "Folo",
        token: "token",
        etag: null,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<GitHubRequestError>>({
        name: "GitHubRequestError",
        status: 401,
        statusText: "Unauthorized",
        body: JSON.stringify({ message: "Bad credentials" }),
      }),
    )
  })
})

describe("extractMirroredFiles", () => {
  it("extracts only referenced files from a tar archive", async () => {
    const iosBundle = textEncoder.encode("console.log('ios')")
    const archiveBuffer = await createTarArchive([
      {
        name: "bundles/ios-main.js",
        body: iosBundle,
      },
      {
        name: "bundles/unused.js",
        body: textEncoder.encode("console.log('unused')"),
      },
    ])

    const files = await extractMirroredFiles({
      release: {
        ...baseRelease,
        platforms: {
          ios: {
            launchAsset: {
              path: "bundles/ios-main.js",
              sha256: await sha256Hex(iosBundle),
              contentType: "application/javascript",
            },
            assets: [],
          },
        },
      },
      archiveBuffer,
    })

    expect(files).toEqual([
      {
        key: "mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js",
        body: iosBundle,
        contentType: "application/javascript",
      },
    ])
  })

  it("throws when a referenced archive file is missing", async () => {
    const archiveBuffer = await createTarArchive([
      {
        name: "bundles/unused.js",
        body: textEncoder.encode("console.log('unused')"),
      },
    ])

    await expect(
      extractMirroredFiles({
        release: {
          ...baseRelease,
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
        },
        archiveBuffer,
      }),
    ).rejects.toThrow('Archive is missing referenced file "bundles/ios-main.js"')
  })

  it("throws when a referenced archive file hash does not match metadata", async () => {
    const archiveBuffer = await createTarArchive([
      {
        name: "bundles/ios-main.js",
        body: textEncoder.encode("console.log('tampered')"),
      },
    ])

    await expect(
      extractMirroredFiles({
        release: {
          ...baseRelease,
          platforms: {
            ios: {
              launchAsset: {
                path: "bundles/ios-main.js",
                sha256: await sha256Hex(textEncoder.encode("console.log('ios')")),
                contentType: "application/javascript",
              },
              assets: [],
            },
          },
        },
        archiveBuffer,
      }),
    ).rejects.toThrow('Archive file "bundles/ios-main.js" hash mismatch')
  })
})

describe("putMirroredFiles", () => {
  it("forwards content metadata and immutable cache headers to R2", async () => {
    const bucket = {
      put: vi.fn(async () => null),
    } as unknown as R2Bucket

    await putMirroredFiles(bucket, [
      {
        key: "mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js",
        body: textEncoder.encode("console.log('ios')"),
        contentType: "application/javascript",
      },
    ])

    expect(bucket.put).toHaveBeenCalledWith(
      "mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js",
      textEncoder.encode("console.log('ios')"),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({
          contentType: "application/javascript",
          cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
        }),
      }),
    )
  })
})

describe("mirrorReleaseToStorage", () => {
  it("stores mirrored release metadata and latest pointers only for platforms with mirrored payloads", async () => {
    const kvWrites: string[] = []
    const r2Writes: string[] = []

    const kv = {
      put: vi.fn(async (key: string) => {
        kvWrites.push(key)
      }),
      get: vi.fn(async () => null),
    } as unknown as KVNamespace

    const bucket = {
      put: vi.fn(async (key: string) => {
        r2Writes.push(key)
      }),
    } as unknown as R2Bucket

    await mirrorReleaseToStorage(
      {
        release: {
          ...baseRelease,
          platforms: {
            ios: {
              launchAsset: {
                path: "bundles/ios-main.js",
                sha256: "a".repeat(64),
                contentType: "application/javascript",
              },
              assets: [],
            },
            android: {
              launchAsset: {
                path: "bundles/android-main.js",
                sha256: "b".repeat(64),
                contentType: "application/javascript",
              },
              assets: [],
            },
          },
        },
        files: [
          {
            key: "mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js",
            body: new Uint8Array([1, 2, 3]),
            contentType: "application/javascript",
          },
        ],
      },
      { kv, bucket },
    )

    expect(r2Writes).toContain("mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js")

    const releaseWriteIndex = kvWrites.findIndex((key) => key.includes("release:mobile:0.4.2"))
    const latestWriteIndex = kvWrites.findIndex((key) =>
      key.includes("latest:mobile:production:0.4.1:ios"),
    )

    expect(releaseWriteIndex).toBeGreaterThanOrEqual(0)
    expect(latestWriteIndex).toBeGreaterThan(releaseWriteIndex)
    expect(kvWrites.some((key) => key.includes("latest:mobile:production:0.4.1:ios"))).toBe(true)
    expect(kvWrites.some((key) => key.includes("latest:mobile:production:0.4.1:android"))).toBe(
      false,
    )
  })
})

describe("syncGitHubReleases", () => {
  it("updates lastSuccessAt when GitHub reports no release changes", async () => {
    const kvEntries = new Map<string, unknown>([[KV_KEYS.githubEtag, '"etag-current"']])

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 304 })),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(kvEntries.get(KV_KEYS.githubEtag)).toBe('"etag-current"')
    expect(kvEntries.get(KV_KEYS.syncLastSuccessAt)).toEqual(expect.any(String))
  })

  it("does not advance sync markers when a later release fails validation", async () => {
    const kvEntries = new Map<string, unknown>([
      [KV_KEYS.githubEtag, '"etag-old"'],
      [KV_KEYS.syncLastSuccessAt, "2026-04-10T10:00:00.000Z"],
    ])
    const validStoreRelease = await createReleaseMetadata({
      releaseVersion: "0.5.2",
      releaseKind: "store",
      runtimeVersion: "0.5.2",
      publishedAt: "2026-04-10T17:00:00Z",
      git: {
        tag: "mobile/v0.5.2",
        commit: "abcdef1234567896",
      },
      policy: {
        storeRequired: false,
        minSupportedBinaryVersion: "0.5.0",
        message: "Install 0.5.2 from the store.",
      },
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "mobile-v0.5.2",
                "https://example.com/valid-store.json",
                "https://example.com/valid-store.tar.zst",
              ),
              createGitHubReleaseAssetSet(
                "mobile-v0.5.3",
                "https://example.com/invalid-store.json",
                "https://example.com/invalid-store.tar.zst",
              ),
            ]),
            {
              status: 200,
              headers: {
                ETag: '"etag-new"',
              },
            },
          )
        }

        if (url === "https://example.com/valid-store.json") {
          return new Response(JSON.stringify(validStoreRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        if (url === "https://example.com/invalid-store.json") {
          return new Response(
            JSON.stringify({
              schemaVersion: 1,
              product: "mobile",
              channel: "production",
              releaseVersion: "invalid",
            }),
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          )
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await expect(
      syncGitHubReleases(
        createEnv({
          kvEntries,
          envOverrides: {
            GITHUB_OWNER: "RSSNext",
            GITHUB_REPO: "Folo",
            GITHUB_TOKEN: "token",
          },
        }),
      ),
    ).rejects.toThrow()

    expect(kvEntries.get(KV_KEYS.policy("mobile", "production"))).toBe(
      JSON.stringify(validStoreRelease),
    )
    expect(kvEntries.get(KV_KEYS.githubEtag)).toBe('"etag-old"')
    expect(kvEntries.get(KV_KEYS.syncLastSuccessAt)).toBe("2026-04-10T10:00:00.000Z")
  })

  it("deduplicates concurrent sync calls within the same isolate", async () => {
    const kvEntries = new Map<string, unknown>()
    const releasesResponse = createDeferred<Response>()
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
        return releasesResponse.promise
      }

      throw new Error(`Unhandled fetch URL: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const env = createEnv({
      kvEntries,
      envOverrides: {
        GITHUB_OWNER: "RSSNext",
        GITHUB_REPO: "Folo",
        GITHUB_TOKEN: "token",
      },
    })

    const firstSync = syncGitHubReleases(env)
    const secondSync = syncGitHubReleases(env)

    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    releasesResponse.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          ETag: '"etag-deduped"',
        },
      }),
    )

    await Promise.all([firstSync, secondSync])

    expect(kvEntries.get(KV_KEYS.githubEtag)).toBe('"etag-deduped"')
    expect(kvEntries.get(KV_KEYS.syncLastSuccessAt)).toEqual(expect.any(String))
  })

  it("syncs store releases without requiring archive assets", async () => {
    const kvEntries = new Map<string, unknown>()
    const storeRelease = await createReleaseMetadata({
      releaseVersion: "0.4.3",
      releaseKind: "store",
      runtimeVersion: "0.4.3",
      publishedAt: "2026-04-10T16:00:00Z",
      git: {
        tag: "mobile/v0.4.3",
        commit: "abcdef1234567895",
      },
      policy: {
        storeRequired: true,
        minSupportedBinaryVersion: "0.4.3",
        message: "Install 0.4.3 from the store.",
      },
      platforms: {},
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet("mobile/v0.4.3", "https://example.com/store.json", null),
            ]),
            { status: 200 },
          )
        }

        if (url === "https://example.com/store.json") {
          return new Response(JSON.stringify(storeRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(kvEntries.get(KV_KEYS.policy("mobile", "production"))).toBe(JSON.stringify(storeRelease))
    expect(kvEntries.get(KV_KEYS.release("mobile", "0.4.3"))).toBe(JSON.stringify(storeRelease))
  })

  it("writes distribution-aware policy keys for desktop binary metadata", async () => {
    const kvEntries = new Map<string, unknown>()
    const binaryRelease = createDesktopReleaseMetadata({
      releaseKind: "binary",
      runtimeVersion: null,
      desktop: {
        renderer: null,
        app: null,
      },
      policy: {
        required: true,
        minSupportedBinaryVersion: "1.5.0",
        message: "Install the latest desktop app.",
        distributions: {
          direct: {
            downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
          },
          mas: {
            storeUrl: "https://apps.apple.com/app/id123456789",
          },
          mss: {
            storeUrl: "ms-windows-store://pdp/?ProductId=9NBLGGH12345",
          },
        },
      },
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "desktop/v1.5.1",
                "https://example.com/desktop-binary.json",
                null,
              ),
            ]),
            { status: 200 },
          )
        }

        if (url === "https://example.com/desktop-binary.json") {
          return new Response(JSON.stringify(binaryRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(kvEntries.get(KV_KEYS.release("desktop", "1.5.1"))).toBe(JSON.stringify(binaryRelease))
    expect(kvEntries.get(KV_KEYS.policy("desktop", "stable"))).toEqual(expect.any(String))
    expect(kvEntries.get(KV_KEYS.policy("desktop", "stable", "direct"))).toEqual(expect.any(String))
    expect(kvEntries.get(KV_KEYS.policy("desktop", "stable", "mas"))).toEqual(expect.any(String))
    expect(kvEntries.get(KV_KEYS.policy("desktop", "stable", "mss"))).toEqual(expect.any(String))

    expect(
      JSON.parse(String(kvEntries.get(KV_KEYS.policy("desktop", "stable", "direct")))),
    ).toEqual(
      expect.objectContaining({
        distribution: "direct",
        downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
        storeUrl: null,
      }),
    )
    expect(JSON.parse(String(kvEntries.get(KV_KEYS.policy("desktop", "stable", "mas"))))).toEqual(
      expect.objectContaining({
        distribution: "mas",
        downloadUrl: null,
        storeUrl: "https://apps.apple.com/app/id123456789",
      }),
    )
  })

  it("clears stale desktop distribution policy keys that disappear from a newer binary release", async () => {
    const kvEntries = new Map<string, unknown>([
      [
        KV_KEYS.policy("desktop", "stable", "mas"),
        JSON.stringify({
          releaseVersion: "1.5.0",
          required: false,
          minSupportedBinaryVersion: "1.5.0",
          message: "Old store policy.",
          publishedAt: "2026-04-11T09:00:00Z",
          distribution: "mas",
          downloadUrl: null,
          storeUrl: "https://apps.apple.com/app/id123456789",
        }),
      ],
    ])

    const binaryRelease = createDesktopReleaseMetadata({
      releaseKind: "binary",
      runtimeVersion: null,
      desktop: {
        renderer: null,
        app: null,
      },
      policy: {
        required: false,
        minSupportedBinaryVersion: "1.5.0",
        message: "Use the latest direct installer.",
        distributions: {
          direct: {
            downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
          },
        },
      },
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "desktop/v1.5.1",
                "https://example.com/desktop-binary.json",
                null,
              ),
            ]),
            { status: 200 },
          )
        }

        if (url === "https://example.com/desktop-binary.json") {
          return new Response(JSON.stringify(binaryRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(kvEntries.get(KV_KEYS.policy("desktop", "stable", "direct"))).toEqual(expect.any(String))
    expect(kvEntries.has(KV_KEYS.policy("desktop", "stable", "mas"))).toBe(false)
  })

  it("does not delete newer desktop distribution policy keys when an older binary release syncs later", async () => {
    const kvEntries = new Map<string, unknown>([
      [
        KV_KEYS.policy("desktop", "stable", "mas"),
        JSON.stringify({
          releaseVersion: "1.5.2",
          required: false,
          minSupportedBinaryVersion: "1.5.0",
          message: "Newer store policy.",
          publishedAt: "2026-04-11T10:00:00Z",
          distribution: "mas",
          downloadUrl: null,
          storeUrl: "https://apps.apple.com/app/id123456789",
        }),
      ],
    ])

    const olderBinaryRelease = createDesktopReleaseMetadata({
      releaseVersion: "1.5.1",
      releaseKind: "binary",
      runtimeVersion: null,
      desktop: {
        renderer: null,
        app: null,
      },
      policy: {
        required: false,
        minSupportedBinaryVersion: "1.5.0",
        message: "Older direct installer policy.",
        distributions: {
          direct: {
            downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
          },
        },
      },
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "desktop/v1.5.1",
                "https://example.com/desktop-older-binary.json",
                null,
              ),
            ]),
            { status: 200 },
          )
        }

        if (url === "https://example.com/desktop-older-binary.json") {
          return new Response(JSON.stringify(olderBinaryRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(JSON.parse(String(kvEntries.get(KV_KEYS.policy("desktop", "stable", "mas"))))).toEqual(
      expect.objectContaining({
        releaseVersion: "1.5.2",
        distribution: "mas",
      }),
    )
  })

  it("mirrors only desktop renderer archives and writes latest pointers for desktop ota", async () => {
    const kvEntries = new Map<string, unknown>()
    const bucketEntries = new Map<string, { body: Uint8Array; headers?: Record<string, string> }>()
    const rendererBundle = textEncoder.encode("desktop renderer bundle")
    const desktopOtaRelease = createDesktopReleaseMetadata({
      releaseKind: "ota",
      runtimeVersion: "1.5.0",
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
            sha256: await sha256Hex(rendererBundle),
            contentType: "application/gzip",
          },
          assets: [],
        },
        app: {
          platforms: {
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
          },
        },
      },
    })
    const desktopArchive = await createTarArchive([
      {
        name: "renderer/custom-renderer.tar.gz",
        body: rendererBundle,
      },
    ])

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "desktop/v1.5.1",
                "https://example.com/desktop-ota.json",
                "https://example.com/desktop-ota.tar.zst",
              ),
            ]),
            { status: 200 },
          )
        }

        if (url === "https://example.com/desktop-ota.json") {
          return new Response(JSON.stringify(desktopOtaRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        if (url === "https://example.com/desktop-ota.tar.zst") {
          const archivePayload = new Uint8Array(desktopArchive.byteLength)
          archivePayload.set(desktopArchive)
          return new Response(archivePayload.buffer)
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        bucketEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(kvEntries.get(KV_KEYS.release("desktop", "1.5.1"))).toBe(
      JSON.stringify(desktopOtaRelease),
    )
    expect(kvEntries.get(KV_KEYS.latest("desktop", "stable", "1.5.0", "macos"))).toBe(
      JSON.stringify({ releaseVersion: "1.5.1" }),
    )
    expect(kvEntries.get(KV_KEYS.latest("desktop", "stable", "1.5.0", "windows"))).toBe(
      JSON.stringify({ releaseVersion: "1.5.1" }),
    )
    expect(kvEntries.get(KV_KEYS.latest("desktop", "stable", "1.5.0", "linux"))).toBe(
      JSON.stringify({ releaseVersion: "1.5.1" }),
    )
    expect(
      bucketEntries.has("desktop/stable/1.5.0/1.5.1/macos/renderer/custom-renderer.tar.gz"),
    ).toBe(true)
    expect(
      bucketEntries.has("desktop/stable/1.5.0/1.5.1/windows/renderer/custom-renderer.tar.gz"),
    ).toBe(true)
    expect(
      bucketEntries.has("desktop/stable/1.5.0/1.5.1/linux/renderer/custom-renderer.tar.gz"),
    ).toBe(true)
    expect(bucketEntries.has("desktop/stable/1.5.0/1.5.1/windows/latest.yml")).toBe(false)
  })

  it("downloads private release assets through authenticated GitHub asset API requests", async () => {
    const kvEntries = new Map<string, unknown>()
    const bucketEntries = new Map<string, { body: Uint8Array; headers?: Record<string, string> }>()
    const otaBundle = textEncoder.encode("console.log('private-ota')")
    const otaRelease = await createReleaseMetadata({
      platforms: {
        ios: {
          launchAsset: {
            path: "bundles/ios-main.js",
            sha256: await sha256Hex(otaBundle),
            contentType: "application/javascript",
          },
          assets: [],
        },
      },
    })
    const otaArchive = await createTarArchive([
      {
        name: "bundles/ios-main.js",
        body: otaBundle,
      },
    ])

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)

      if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
        return new Response(
          JSON.stringify([
            createGitHubReleaseAssetSet(
              "mobile/v0.4.2",
              "https://github.com/RSSNext/Folo/releases/download/mobile/v0.4.2/ota-release.json",
              "https://github.com/RSSNext/Folo/releases/download/mobile/v0.4.2/dist.tar.zst",
              {
                metadataApiUrl: "https://api.github.com/repos/RSSNext/Folo/releases/assets/1",
                archiveApiUrl: "https://api.github.com/repos/RSSNext/Folo/releases/assets/2",
              },
            ),
          ]),
          { status: 200 },
        )
      }

      if (url === "https://api.github.com/repos/RSSNext/Folo/releases/assets/1") {
        expect(init).toMatchObject({
          headers: expect.objectContaining({
            Authorization: "Bearer token",
            Accept: "application/octet-stream",
            "User-Agent": expect.any(String),
          }),
        })

        return new Response(JSON.stringify(otaRelease), {
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        })
      }

      if (url === "https://api.github.com/repos/RSSNext/Folo/releases/assets/2") {
        expect(init).toMatchObject({
          headers: expect.objectContaining({
            Authorization: "Bearer token",
            Accept: "application/octet-stream",
            "User-Agent": expect.any(String),
          }),
        })

        const archivePayload = new Uint8Array(otaArchive.byteLength)
        archivePayload.set(otaArchive)

        return new Response(archivePayload.buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        })
      }

      if (url.startsWith("https://github.com/RSSNext/Folo/releases/download/")) {
        return new Response("Not Found", {
          status: 404,
          statusText: "Not Found",
        })
      }

      throw new Error(`Unhandled fetch URL: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        bucketEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(bucketEntries.has("mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js")).toBe(true)
  })

  it("keeps newer OTA pointers and store policy records when releases arrive out of order", async () => {
    const kvEntries = new Map<string, unknown>()
    const bucketEntries = new Map<string, { body: Uint8Array; headers?: Record<string, string> }>()

    const newerOtaBundle = textEncoder.encode("console.log('ota-newer')")
    const olderOtaBundle = textEncoder.encode("console.log('ota-older')")
    const newerOtaRelease = await createReleaseMetadata({
      releaseVersion: "0.4.4",
      publishedAt: "2026-04-10T14:00:00Z",
      git: {
        tag: "mobile/v0.4.4",
        commit: "abcdef1234567891",
      },
      platforms: {
        ios: {
          launchAsset: {
            path: "bundles/ios-main.js",
            sha256: await sha256Hex(newerOtaBundle),
            contentType: "application/javascript",
          },
          assets: [],
        },
      },
    })
    const olderOtaRelease = await createReleaseMetadata({
      releaseVersion: "0.4.3",
      publishedAt: "2026-04-10T13:00:00Z",
      git: {
        tag: "mobile/v0.4.3",
        commit: "abcdef1234567892",
      },
      platforms: {
        ios: {
          launchAsset: {
            path: "bundles/ios-main.js",
            sha256: await sha256Hex(olderOtaBundle),
            contentType: "application/javascript",
          },
          assets: [],
        },
      },
    })
    const newerStoreRelease = await createReleaseMetadata({
      releaseVersion: "0.5.0",
      releaseKind: "store",
      runtimeVersion: "0.5.0",
      publishedAt: "2026-04-10T12:30:00Z",
      git: {
        tag: "mobile/v0.5.0",
        commit: "abcdef1234567893",
      },
      policy: {
        storeRequired: true,
        minSupportedBinaryVersion: "0.4.8",
        message: "Install 0.5.0 from the store.",
      },
    })
    const olderStoreRelease = await createReleaseMetadata({
      releaseVersion: "0.4.8",
      releaseKind: "store",
      runtimeVersion: "0.4.8",
      publishedAt: "2026-04-10T11:00:00Z",
      git: {
        tag: "mobile/v0.4.8",
        commit: "abcdef1234567894",
      },
      policy: {
        storeRequired: false,
        minSupportedBinaryVersion: "0.4.5",
        message: "Install 0.4.8 from the store.",
      },
    })

    const newerOtaArchive = await createTarArchive([
      {
        name: "bundles/ios-main.js",
        body: newerOtaBundle,
      },
    ])
    const olderOtaArchive = await createTarArchive([
      {
        name: "bundles/ios-main.js",
        body: olderOtaBundle,
      },
    ])

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "mobile-v0.4.4",
                "https://example.com/newer-ota.json",
                "https://example.com/newer-ota.tar.zst",
              ),
              createGitHubReleaseAssetSet(
                "mobile-v0.4.3",
                "https://example.com/older-ota.json",
                "https://example.com/older-ota.tar.zst",
              ),
              createGitHubReleaseAssetSet(
                "mobile-v0.5.0",
                "https://example.com/newer-store.json",
                "https://example.com/newer-store.tar.zst",
              ),
              createGitHubReleaseAssetSet(
                "mobile-v0.4.8",
                "https://example.com/older-store.json",
                "https://example.com/older-store.tar.zst",
              ),
            ]),
            {
              status: 200,
              headers: {
                ETag: '"etag-200"',
              },
            },
          )
        }

        const metadataBodies: Record<string, OtaRelease> = {
          "https://example.com/newer-ota.json": newerOtaRelease,
          "https://example.com/older-ota.json": olderOtaRelease,
          "https://example.com/newer-store.json": newerStoreRelease,
          "https://example.com/older-store.json": olderStoreRelease,
        }

        if (url in metadataBodies) {
          return new Response(JSON.stringify(metadataBodies[url]), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        const archiveBodies: Record<string, Uint8Array> = {
          "https://example.com/newer-ota.tar.zst": newerOtaArchive,
          "https://example.com/older-ota.tar.zst": olderOtaArchive,
        }

        const archiveBody = archiveBodies[url]

        if (archiveBody) {
          const archivePayload = new Uint8Array(archiveBody.byteLength)
          archivePayload.set(archiveBody)

          return new Response(new Blob([archivePayload.buffer]))
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    await syncGitHubReleases(
      createEnv({
        kvEntries,
        bucketEntries,
        envOverrides: {
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      }),
    )

    expect(kvEntries.get(KV_KEYS.githubEtag)).toBe('"etag-200"')
    expect(kvEntries.get(KV_KEYS.syncLastSuccessAt)).toEqual(expect.any(String))
    expect(kvEntries.get(KV_KEYS.latest("mobile", "production", "0.4.1", "ios"))).toBe(
      JSON.stringify({
        releaseVersion: "0.4.4",
      }),
    )
    expect(kvEntries.get(KV_KEYS.policy("mobile", "production"))).toBe(
      JSON.stringify(newerStoreRelease),
    )
    expect(bucketEntries.has("mobile/production/0.4.1/0.4.4/ios/bundles/ios-main.js")).toBe(true)
    expect(kvEntries.get(KV_KEYS.release("mobile", "0.5.0"))).toBe(
      JSON.stringify(newerStoreRelease),
    )
  })
})

describe("internal routes", () => {
  it("returns the last successful sync timestamp from KV", async () => {
    const response = await fetchWorker("/internal/health", undefined, {
      kvEntries: new Map([[KV_KEYS.syncLastSuccessAt, "2026-04-10T15:00:00.000Z"]]),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      lastSuccessAt: "2026-04-10T15:00:00.000Z",
    })
  })

  it("rejects sync requests with an invalid token", async () => {
    const response = await fetchWorker(
      "/internal/sync",
      {
        method: "POST",
        headers: {
          "x-ota-sync-token": "wrong-token",
        },
      },
      {
        envOverrides: {
          OTA_SYNC_TOKEN: "expected-token",
        },
      },
    )

    expect(response.status).toBe(401)
  })

  it("runs sync for authorized requests", async () => {
    const kvEntries = new Map<string, unknown>()
    const storeRelease = await createReleaseMetadata({
      releaseVersion: "0.5.1",
      releaseKind: "store",
      runtimeVersion: "0.5.1",
      publishedAt: "2026-04-10T16:00:00Z",
      git: {
        tag: "mobile/v0.5.1",
        commit: "abcdef1234567895",
      },
      policy: {
        storeRequired: false,
        minSupportedBinaryVersion: "0.5.0",
        message: "Install 0.5.1 from the store.",
      },
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url === "https://api.github.com/repos/RSSNext/Folo/releases") {
          return new Response(
            JSON.stringify([
              createGitHubReleaseAssetSet(
                "mobile-v0.5.1",
                "https://example.com/store.json",
                "https://example.com/store.tar.zst",
              ),
            ]),
            { status: 200 },
          )
        }

        if (url === "https://example.com/store.json") {
          return new Response(JSON.stringify(storeRelease), {
            headers: {
              "Content-Type": "application/json",
            },
          })
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    const response = await fetchWorker(
      "/internal/sync",
      {
        method: "POST",
        headers: {
          "x-ota-sync-token": "expected-token",
        },
      },
      {
        kvEntries,
        envOverrides: {
          OTA_SYNC_TOKEN: "expected-token",
          GITHUB_OWNER: "RSSNext",
          GITHUB_REPO: "Folo",
          GITHUB_TOKEN: "token",
        },
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
    })
    expect(kvEntries.get(KV_KEYS.policy("mobile", "production"))).toBe(JSON.stringify(storeRelease))
  })
})

describe("scheduled handler", () => {
  it("dispatches sync work through waitUntil", async () => {
    const kvEntries = new Map<string, unknown>([[KV_KEYS.githubEtag, '"etag-current"']])

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 304 })),
    )

    const env = createEnv({
      kvEntries,
      envOverrides: {
        GITHUB_OWNER: "RSSNext",
        GITHUB_REPO: "Folo",
        GITHUB_TOKEN: "token",
      },
    })
    const ctx = createExecutionContext()

    otaWorker.scheduled?.({} as ScheduledController, env, ctx)

    expect(ctx.waitUntil).toHaveBeenCalledTimes(1)

    const [syncPromise] = vi.mocked(ctx.waitUntil).mock.calls[0] ?? []
    await syncPromise

    expect(kvEntries.get(KV_KEYS.syncLastSuccessAt)).toEqual(expect.any(String))
  })
})

async function createTarArchive(
  entries: Array<{
    name: string
    body: Uint8Array
  }>,
) {
  const pack = tar.pack()
  const archiveChunks: Uint8Array[] = []

  const archivePromise = new Promise<Uint8Array>((resolve, reject) => {
    pack.on("data", (chunk) => {
      archiveChunks.push(new Uint8Array(chunk))
    })
    pack.on("error", reject)
    pack.on("end", () => {
      resolve(concatenateChunks(archiveChunks))
    })
  })

  for (const entry of entries) {
    await new Promise<void>((resolve, reject) => {
      const tarEntry = pack.entry(
        {
          name: entry.name,
          size: entry.body.byteLength,
        },
        (error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        },
      )

      tarEntry.on("error", reject)
      tarEntry.end(entry.body)
    })
  }

  pack.finalize()

  return archivePromise
}

function concatenateChunks(chunks: readonly Uint8Array[]) {
  const totalLength = chunks.reduce((length, chunk) => length + chunk.byteLength, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }

  return output
}

async function sha256Hex(data: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", toDigestInput(data))

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function toDigestInput(data: Uint8Array) {
  return new Uint8Array(data)
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
    envOverrides?: Partial<Env>
  },
) {
  return otaWorker.fetch(
    new Request(`https://ota.folo.is${path}`, init),
    createEnv(options),
    createExecutionContext(),
  )
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
  envOverrides?: Partial<Env>
}): Env {
  return {
    OTA_KV: createKvNamespace(options?.kvEntries),
    OTA_BUCKET: createR2Bucket(options?.bucketEntries),
    GITHUB_OWNER: "",
    GITHUB_REPO: "",
    GITHUB_TOKEN: "",
    OTA_SYNC_TOKEN: "",
    OTA_SYNC_TOKEN_HEADER: "x-ota-sync-token",
    ...options?.envOverrides,
  }
}

function createKvNamespace(entries = new Map<string, unknown>()): KVNamespace {
  return {
    get: vi.fn(async (key: string, type?: string) => {
      const value = entries.get(key)

      if (value == null) {
        return null
      }

      if (type === "json") {
        if (typeof value === "string") {
          return JSON.parse(value)
        }

        return value
      }

      return typeof value === "string" ? value : JSON.stringify(value)
    }),
    put: vi.fn(async (key: string, value: string) => {
      entries.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      entries.delete(key)
    }),
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
    put: vi.fn(
      async (
        key: string,
        body: ReadableStream | ArrayBuffer | ArrayBufferView | string | null,
        options?: R2PutOptions,
      ) => {
        const httpMetadata =
          options?.httpMetadata instanceof Headers ? undefined : options?.httpMetadata

        entries.set(key, {
          body: toUint8Array(body),
          headers: httpMetadata?.contentType
            ? {
                "content-type": httpMetadata.contentType,
              }
            : undefined,
        })

        return null
      },
    ),
  } as unknown as R2Bucket
}

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext
}

async function createReleaseMetadata(
  overrides: Partial<MobileOtaRelease> = {},
): Promise<MobileOtaRelease> {
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
          sha256: await sha256Hex(textEncoder.encode("console.log('ios')")),
          contentType: "application/javascript",
        },
        assets: [],
      },
    },
    ...overrides,
  }
}

function createDesktopReleaseMetadata(
  overrides: Partial<DesktopOtaRelease> = {},
): DesktopOtaRelease {
  return otaReleaseSchema.parse({
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
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
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
        },
      },
    },
    ...overrides,
  }) as DesktopOtaRelease
}

function createGitHubReleaseAssetSet(
  tag: string,
  metadataUrl: string,
  archiveUrl: string | null,
  options?: {
    metadataApiUrl?: string
    archiveApiUrl?: string
  },
) {
  return {
    tag_name: tag,
    draft: false,
    prerelease: false,
    assets: [
      {
        name: "ota-release.json",
        url: options?.metadataApiUrl ?? metadataUrl,
        browser_download_url: metadataUrl,
      },
      ...(archiveUrl
        ? [
            {
              name: "dist.tar.zst",
              url: options?.archiveApiUrl ?? archiveUrl,
              browser_download_url: archiveUrl,
            },
          ]
        : []),
    ],
  }
}

function toUint8Array(body: ReadableStream | ArrayBuffer | ArrayBufferView | string | null) {
  if (body == null) {
    return new Uint8Array()
  }

  if (typeof body === "string") {
    return textEncoder.encode(body)
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
  }

  throw new Error("ReadableStream bodies are not supported in tests")
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return {
    promise,
    resolve,
    reject,
  }
}
