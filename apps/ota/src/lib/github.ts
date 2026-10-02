export interface GitHubReleaseAsset {
  name: string
  url?: string
  browser_download_url: string
}

export interface GitHubRelease {
  tag_name: string
  draft: boolean
  prerelease: boolean
  published_at?: string | null
  assets?: GitHubReleaseAsset[]
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

export type GitHubRawReleaseListResult =
  | { kind: "not-modified" }
  | {
      kind: "ok"
      etag: string | null
      releases: GitHubRelease[]
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

/**
 * Fetches the first page of GitHub releases, newest first. Drafts are kept so callers decide how
 * to treat them.
 */
export async function fetchGitHubReleases(input: {
  owner: string
  repo: string
  token: string
  etag: string | null
}): Promise<GitHubRawReleaseListResult> {
  const userAgent = `folo-ota-worker/${input.owner}.${input.repo}`

  const response = await fetch(
    `https://api.github.com/repos/${input.owner}/${input.repo}/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": userAgent,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
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

  return {
    kind: "ok",
    etag: response.headers.get("etag"),
    releases: (await response.json()) as GitHubRelease[],
  }
}

export function toOtaReleaseSummaries(releases: readonly GitHubRelease[]): GitHubReleaseSummary[] {
  return releases
    .filter((release) => !release.draft)
    .map((release) => {
      const assets = release.assets ?? []
      const metadata = assets.find((asset) => asset.name === "ota-release.json")
      const archive = assets.find((asset) => asset.name === "dist.tar.zst")

      if (!metadata) {
        return null
      }

      return {
        tag: release.tag_name,
        metadataUrl: metadata.url ?? metadata.browser_download_url,
        archiveUrl: archive ? (archive.url ?? archive.browser_download_url) : null,
      }
    })
    .filter((value): value is GitHubReleaseSummary => value !== null)
}

export async function listPublishedOtaReleases(input: {
  owner: string
  repo: string
  token: string
  etag: string | null
}): Promise<GitHubReleaseListResult> {
  const result = await fetchGitHubReleases(input)

  if (result.kind === "not-modified") {
    return result
  }

  return {
    kind: "ok",
    etag: result.etag,
    releases: toOtaReleaseSummaries(result.releases),
  }
}
