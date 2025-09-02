import { existsSync, readFileSync } from "node:fs"

import log from "electron-log"
import { load } from "js-yaml"
import path from "pathe"

import { GITHUB_OWNER, GITHUB_REPO, HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"

export interface RenderManifest {
  /** Renderer version */
  version: string
  hash: string
  commit: string
  filename: string
  /** Only when electron main hash equals this value can the renderer be updated */
  mainHash: string
}

const logger = log.scope("render-manifest")

const repoUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
const releasesUrl = `${repoUrl}/releases`
const releaseApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`

/**
 * Retrieve latest release tag from GitHub.
 * Only desktop releases are considered.
 */
export const getLatestReleaseTag = async (): Promise<string> => {
  try {
    const latestRes = await fetch(`${releaseApiUrl}/latest`)
    if (latestRes.ok) {
      const latest = await latestRes.json()
      if (latest.tag_name && latest.tag_name.startsWith("desktop/") && !latest.draft) {
        return latest.tag_name
      }
    }
  } catch (error) {
    logger.warn("Failed to fetch latest release, fallback to all releases", error)
  }

  const res = await fetch(releaseApiUrl)
  if (!res.ok) {
    throw new Error(`GitHub API request failed: ${res.status} ${res.statusText}`)
  }

  const releases = await res.json()
  if (!Array.isArray(releases)) {
    throw new TypeError("Invalid response format from GitHub API")
  }

  const desktopReleases = releases.filter(
    (r: any) => r.tag_name && r.tag_name.startsWith("desktop/") && !r.draft,
  )
  if (desktopReleases.length === 0) {
    throw new Error("No desktop releases found")
  }

  desktopReleases.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  return desktopReleases[0].tag_name
}

export const getFileDownloadUrl = async (filename: string) => {
  const tag = await getLatestReleaseTag()
  return `${releasesUrl}/download/${tag}/${filename}`
}

/** Fetch latest renderer manifest from GitHub releases */
export const fetchLatestManifest = async (): Promise<RenderManifest | null> => {
  const url = await getFileDownloadUrl("manifest.yml")
  logger.info(`Fetching manifest from ${url}`)
  const res = await fetch(url)
  if (!res.ok) {
    logger.error(`Failed to fetch manifest: ${res.status} ${res.statusText}`)
    return null
  }

  const text = await res.text()
  const manifest = load(text) as RenderManifest
  if (typeof manifest !== "object") {
    logger.error("Invalid manifest", text)
    return null
  }
  return manifest
}

export const getCurrentManifest = (): RenderManifest | null => {
  const manifestFilePath = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "manifest.yml")
  if (!existsSync(manifestFilePath)) return null
  return load(readFileSync(manifestFilePath, "utf-8")) as RenderManifest
}
