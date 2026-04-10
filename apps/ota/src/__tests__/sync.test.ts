import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { GitHubRequestError } from "../lib/github"
import { listPublishedOtaReleases } from "../lib/github"

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
