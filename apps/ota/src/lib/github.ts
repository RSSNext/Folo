export interface GitHubReleaseAsset {
  name: string
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
  archiveUrl: string
}

export async function listPublishedOtaReleases(input: {
  owner: string
  repo: string
  token: string
  etag: string | null
}): Promise<GitHubReleaseSummary[]> {
  const response = await fetch(
    `https://api.github.com/repos/${input.owner}/${input.repo}/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(input.etag ? { "If-None-Match": input.etag } : {}),
      },
    },
  )

  if (response.status === 304) {
    return []
  }

  if (!response.ok) {
    throw new Error(`GitHub releases request failed with ${response.status}`)
  }

  const releases = (await response.json()) as GitHubRelease[]

  return releases
    .filter((release) => !release.draft)
    .map((release) => {
      const metadata = release.assets.find((asset) => asset.name === "ota-release.json")
      const archive = release.assets.find((asset) => asset.name === "dist.tar.zst")

      if (!metadata || !archive) {
        return null
      }

      return {
        tag: release.tag_name,
        metadataUrl: metadata.browser_download_url,
        archiveUrl: archive.browser_download_url,
      }
    })
    .filter((value): value is GitHubReleaseSummary => value !== null)
}
