import tar from "tar-stream"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { extractMirroredFiles } from "../lib/archive"
import type { GitHubRequestError } from "../lib/github"
import { listPublishedOtaReleases } from "../lib/github"
import { IMMUTABLE_ASSET_CACHE_CONTROL, putMirroredFiles } from "../lib/r2"
import { mirrorReleaseToStorage } from "../lib/sync"

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

  it("filters out releases missing required assets", async () => {
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
                  name: "ota-release.json",
                  browser_download_url: "https://example.com/desktop-ota-release.json",
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

    const releaseWriteIndex = kvWrites.findIndex((key) =>
      key.includes("release:mobile:0.4.2"),
    )
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
