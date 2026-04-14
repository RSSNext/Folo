export interface GitHubReleaseAsset {
  name: string
  url?: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: GitHubReleaseAsset[]
}

export interface GitHubReleaseSummary {
  tag: string
  metadataUrl: string
  archiveUrl: string | null
}

export type GitHubReleaseListResult =
  | { kind: "not-modified" }
  | {
      kind: "ok"
      etag: string | null
      releases: GitHubReleaseSummary[]
    }

export class GitHubRequestError extends Error {
  readonly status: number
  readonly statusText: string
  readonly body: string | null

  constructor(input: { status: number; statusText: string; body: string | null }) {
    super(`GitHub releases request failed with ${input.status} ${input.statusText}`.trim())
    this.name = "GitHubRequestError"
    this.status = input.status
    this.statusText = input.statusText
    this.body = input.body
  }
}

export async function listPublishedOtaReleases(input: {
  owner: string
  repo: string
  token: string
  etag: string | null
}): Promise<GitHubReleaseListResult> {
  const userAgent = `folo-ota-worker/${input.owner}.${input.repo}`

  const response = await fetch(
    `https://api.github.com/repos/${input.owner}/${input.repo}/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.token}`,
        "User-Agent": userAgent,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(input.etag ? { "If-None-Match": input.etag } : {}),
      },
    },
  )

  if (response.status === 304) {
    return { kind: "not-modified" }
  }

  if (!response.ok) {
    throw new GitHubRequestError({
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
    })
  }

  const releases = (await response.json()) as GitHubRelease[]

  return {
    kind: "ok",
    etag: response.headers.get("etag"),
    releases: releases
      .filter((release) => !release.draft)
      .map((release) => {
        const metadata = release.assets.find((asset) => asset.name === "ota-release.json")
        const archive = release.assets.find((asset) => asset.name === "dist.tar.zst")

        if (!metadata) {
          return null
        }

        return {
          tag: release.tag_name,
          metadataUrl: metadata.url ?? metadata.browser_download_url,
          archiveUrl: archive ? (archive.url ?? archive.browser_download_url) : null,
        }
      })
      .filter((value): value is GitHubReleaseSummary => value !== null),
  }
}
