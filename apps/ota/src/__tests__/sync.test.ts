import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { GitHubRequestError } from "../lib/github"
import { listPublishedOtaReleases } from "../lib/github"
import { mirrorReleaseToStorage } from "../lib/sync"

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
