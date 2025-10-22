// credits: migrated from https://github.com/toeverything/AFFiNE/blob/a802dc4fd6aa720f7a7a995816c78c0b24c514f5/packages/frontend/electron/src/main/updater/custom-github-provider.ts

import { URL } from "node:url"

import type {
  CustomPublishOptions,
  GithubOptions,
  ReleaseNoteInfo,
  XElement,
} from "builder-util-runtime"
import { HttpError, newError, parseXml } from "builder-util-runtime"
import type { AppUpdater, ResolvedUpdateFileInfo, UpdateInfo } from "electron-updater"
import { CancellationToken } from "electron-updater"
import { BaseGitHubProvider } from "electron-updater/out/providers/GitHubProvider"
import type { ProviderRuntimeOptions } from "electron-updater/out/providers/Provider"
import { parseUpdateInfo, resolveFiles } from "electron-updater/out/providers/Provider"
import * as semver from "semver"

import { isWindows } from "../env"
import { githubProviderLogger as logger, logObject } from "./logger"
import { isSquirrelBuild } from "./utils"

interface GithubUpdateInfo extends UpdateInfo {
  tag: string
}

interface GithubRelease {
  id: number
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
}

const hrefRegExp = /\/tag\/([^/]+)$/

export class CustomGitHubProvider extends BaseGitHubProvider<GithubUpdateInfo> {
  constructor(
    options: CustomPublishOptions,
    private readonly updater: AppUpdater,
    runtimeOptions: ProviderRuntimeOptions,
  ) {
    super(options as unknown as GithubOptions, "github.com", runtimeOptions)
  }

  async getLatestVersion(): Promise<GithubUpdateInfo> {
    logger.info("Starting getLatestVersion")
    logObject(logger, "Provider Configuration", {
      "Base URL": this.baseUrl.href,
      "Base Path": this.basePath,
      "Current Version": this.updater.currentVersion,
      "Allow Prerelease": this.updater.allowPrerelease,
    })

    const cancellationToken = new CancellationToken()

    const feedUrl = newUrlFromBase(`${this.basePath}.atom`, this.baseUrl)
    logger.info(`Fetching feed from: ${feedUrl.href}`)

    const feedXml = await this.httpRequest(
      feedUrl,
      {
        accept: "application/xml, application/atom+xml, text/xml, */*",
      },
      cancellationToken,
    )

    if (!feedXml) {
      throw new Error(`Cannot find feed in the remote server (${this.baseUrl.href})`)
    }

    logger.info(`Feed fetched successfully, length: ${feedXml.length} bytes`)

    const feed = parseXml(feedXml)
    // noinspection TypeScriptValidateJSTypes
    let latestRelease = feed.element("entry", false, `No published versions on GitHub`)
    let tag: string | null = null
    try {
      const currentChannel =
        this.options.channel ||
        this.updater?.channel ||
        (semver.prerelease(this.updater.currentVersion)?.[0] as string) ||
        null

      logger.info(`Current Channel: ${currentChannel}`)

      if (currentChannel === null) {
        throw newError(
          `Cannot parse channel from version: ${this.updater.currentVersion}`,
          "ERR_UPDATER_INVALID_VERSION",
        )
      }

      logger.info(`Fetching latest tag by release API for channel: ${currentChannel}`)
      const releaseTag = await this.getLatestTagByRelease(currentChannel, cancellationToken)
      logger.info(`Release tag from API: ${releaseTag || "null (will use feed matching)"}`)
      logger.info("Iterating through feed entries to find matching release")
      let entryCount = 0
      for (const element of feed.getElements("entry")) {
        entryCount++
        // noinspection TypeScriptValidateJSTypes
        const href = element.element("link").attribute("href")
        const hrefElement = hrefRegExp.exec(href)

        // If this is null then something is wrong and skip this release
        if (hrefElement === null) {
          logger.warn(`Entry #${entryCount}: Invalid href format: ${href}`)
          continue
        }

        // This Release's Tag
        const hrefTag = hrefElement[1]!
        logger.debug(`Entry #${entryCount}: Processing tag: ${hrefTag}`)

        // Get Channel from this release's tag
        // Handle new format: desktop/v1.2.3 or mobile/v1.2.3
        let hrefChannel = "stable"
        if (hrefTag.startsWith("desktop/")) {
          // For desktop tags, extract the version and check if it's a prerelease
          const version = hrefTag.replace("desktop/", "")
          hrefChannel = (semver.prerelease(version)?.[0] as string) || "stable"
          logger.debug(
            `Entry #${entryCount}: Desktop tag detected, version: ${version}, channel: ${hrefChannel}`,
          )
        } else if (hrefTag.startsWith("mobile/")) {
          // Skip mobile releases for desktop updater
          logger.debug(`Entry #${entryCount}: Skipping mobile tag`)
          continue
        } else {
          // Legacy format: check for prerelease directly
          hrefChannel = (semver.prerelease(hrefTag)?.[0] as string) || "stable"
          logger.debug(`Entry #${entryCount}: Legacy tag format, channel: ${hrefChannel}`)
        }

        let isNextPreRelease = false
        if (releaseTag) {
          isNextPreRelease = releaseTag === hrefTag
          logger.debug(`Entry #${entryCount}: Matching by release tag: ${releaseTag === hrefTag}`)
        } else {
          isNextPreRelease = hrefChannel === currentChannel
          logger.debug(
            `Entry #${entryCount}: Matching by channel: ${hrefChannel} === ${currentChannel} = ${isNextPreRelease}`,
          )
        }

        if (isNextPreRelease) {
          tag = hrefTag
          latestRelease = element
          logger.info(`✓ Found matching release at entry #${entryCount}: ${hrefTag}`)
          break
        }
      }
      logger.info(`Processed ${entryCount} feed entries total`)
    } catch (e: any) {
      logger.error(`Failed to parse releases feed: ${e.stack || e.message}`)
      throw newError(
        `Cannot parse releases feed: ${e.stack || e.message},\nXML:\n${feedXml}`,
        "ERR_UPDATER_INVALID_RELEASE_FEED",
      )
    }

    if (tag === null || tag === undefined) {
      logger.error("No matching published versions found on GitHub")
      throw newError(`No published versions on GitHub`, "ERR_UPDATER_NO_PUBLISHED_VERSIONS")
    }

    let rawData: string | null = null
    let channelFile = ""
    let channelFileUrl: any = ""
    const fetchData = async (channelName: string) => {
      channelFile = getChannelFilename(channelName)
      channelFileUrl = newUrlFromBase(
        this.getBaseDownloadPath(String(tag), channelFile),
        this.baseUrl,
      )
      logger.info(`Fetching channel file: ${channelFile} from ${channelFileUrl}`)
      const requestOptions = this.createRequestOptions(channelFileUrl)
      try {
        const data = await this.executor.request(requestOptions, cancellationToken)
        logger.info(`Successfully fetched ${channelFile}`)
        return data
      } catch (e: any) {
        if (e instanceof HttpError && e.statusCode === 404) {
          logger.warn(`Channel file not found: ${channelFile} (404)`)
          throw newError(
            `Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${
              e.stack || e.message
            }`,
            "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND",
          )
        }
        logger.error(`Failed to fetch channel file: ${e.message}`)
        throw e
      }
    }

    try {
      const channel = this.updater.allowPrerelease
        ? this.getCustomChannelName(String(semver.prerelease(tag)?.[0] || "latest"))
        : this.getDefaultChannelName()
      logger.info(`Attempting to fetch channel: ${channel}`)
      rawData = await fetchData(channel)
    } catch (e: any) {
      if (this.updater.allowPrerelease) {
        // Allow fallback to `latest.yml`
        logger.info("Falling back to default channel (latest.yml)")
        rawData = await fetchData(this.getDefaultChannelName())
      } else {
        throw e
      }
    }

    const result = parseUpdateInfo(rawData, channelFile, channelFileUrl)
    if (result.releaseName == null) {
      result.releaseName = latestRelease.elementValueOrEmpty("title")
    }

    if (result.releaseNotes == null) {
      result.releaseNotes = computeReleaseNotes(
        this.updater.currentVersion,
        this.updater.fullChangelog,
        feed,
        latestRelease,
      )
    }

    logger.info(`Update info parsed successfully`)
    logObject(logger, "Update Result", {
      Tag: tag,
      Version: result.version,
      "Release Name": result.releaseName || "N/A",
      "Release Date": result.releaseDate || "N/A",
      Files: result.files?.length || 0,
    })

    return {
      tag,
      ...result,
    }
  }

  private get basePath(): string {
    return `/${this.options.owner}/${this.options.repo}/releases`
  }

  /**
   * Use release api to get latest version to filter draft version.
   * But this api have low request limit 60-times/1-hour, use this to help, not depend on it
   * https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28
   * https://api.github.com/repos/toeverything/affine/releases
   * https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28#about-rate-limits
   */
  private async getLatestTagByRelease(
    currentChannel: string,
    cancellationToken: CancellationToken,
  ) {
    try {
      const apiUrl = newUrlFromBase(`/repos${this.basePath}`, this.baseApiUrl)
      logger.debug(`Fetching releases from GitHub API: ${apiUrl}`)

      const releasesStr = await this.httpRequest(
        apiUrl,
        {
          accept: "Accept: application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cancellationToken,
      )

      if (!releasesStr) {
        logger.warn("GitHub API returned empty response")
        return null
      }

      const releases: GithubRelease[] = JSON.parse(releasesStr)
      logger.debug(`Received ${releases.length} releases from GitHub API`)

      let checkedCount = 0
      for (const release of releases) {
        if (release.draft) {
          logger.debug(`Skipping draft release: ${release.tag_name}`)
          continue
        }

        checkedCount++
        const releaseTag = release.tag_name

        // Handle new format: desktop/v1.2.3 or mobile/v1.2.3
        let releaseChannel = "stable"
        if (releaseTag.startsWith("desktop/")) {
          // For desktop tags, extract the version and check if it's a prerelease
          const version = releaseTag.replace("desktop/", "")
          releaseChannel = (semver.prerelease(version)?.[0] as string) || "stable"
          logger.debug(`API Release: ${releaseTag} (desktop, channel: ${releaseChannel})`)
        } else if (releaseTag.startsWith("mobile/")) {
          // Skip mobile releases for desktop updater
          logger.debug(`Skipping mobile release: ${releaseTag}`)
          continue
        } else {
          // Legacy format: check for prerelease directly
          releaseChannel = (semver.prerelease(releaseTag)?.[0] as string) || "stable"
          logger.debug(`API Release: ${releaseTag} (legacy, channel: ${releaseChannel})`)
        }

        if (releaseChannel === currentChannel) {
          logger.info(`✓ Found matching release via API: ${release.tag_name}`)
          return release.tag_name
        }
      }

      logger.info(`No matching release found via API (checked ${checkedCount} non-draft releases)`)
    } catch (e: any) {
      logger.warn(`Cannot parse release from API: ${e.message}`)
    }

    return null
  }

  resolveFiles(updateInfo: GithubUpdateInfo): Array<ResolvedUpdateFileInfo> {
    logger.info(`Resolving files for tag: ${updateInfo.tag}`)
    logger.debug(`Total files in update info: ${updateInfo.files.length}`)

    const filteredUpdateInfo = structuredClone(updateInfo)
    // for windows, we need to determine its installer type (nsis or squirrel)
    if (isWindows && updateInfo.files.length > 1) {
      const isSquirrel = isSquirrelBuild()
      logger.info(`Windows build detected, installer type: ${isSquirrel ? "Squirrel" : "NSIS"}`)

      // @ts-expect-error we should be able to modify the object
      filteredUpdateInfo.files = updateInfo.files.filter((file) =>
        isSquirrel ? !file.url.includes("nsis.exe") : file.url.includes("nsis.exe"),
      )

      logger.debug(
        `Filtered to ${filteredUpdateInfo.files.length} files after Windows installer type filtering`,
      )
    }

    // still replace space to - due to backward compatibility
    const resolved = resolveFiles(filteredUpdateInfo, this.baseUrl, (p) =>
      this.getBaseDownloadPath(filteredUpdateInfo.tag, p.replaceAll(" ", "-")),
    )

    logger.info(`Resolved ${resolved.length} file(s) for download`)
    resolved.forEach((file, index) => {
      logger.debug(`  File ${index + 1}: ${file.url}`)
    })

    return resolved
  }

  private getBaseDownloadPath(tag: string, fileName: string): string {
    return `${this.basePath}/download/${tag}/${fileName}`
  }
}

export interface CustomGitHubOptions {
  channel: string
  repo: string
  owner: string
  releaseType: "release" | "prerelease"
}

function getNoteValue(parent: XElement): string {
  const result = parent.elementValueOrEmpty("content")
  // GitHub reports empty notes as <content>No content.</content>
  return result === "No content." ? "" : result
}

export function computeReleaseNotes(
  currentVersion: semver.SemVer,
  isFullChangelog: boolean,
  feed: XElement,
  latestRelease: any,
): string | Array<ReleaseNoteInfo> | null {
  if (!isFullChangelog) {
    return getNoteValue(latestRelease)
  }

  const releaseNotes: Array<ReleaseNoteInfo> = []
  for (const release of feed.getElements("entry")) {
    // noinspection TypeScriptValidateJSTypes
    const versionRelease = /\/tag\/v?([^/]+)$/.exec(release.element("link").attribute("href"))?.[1]
    if (versionRelease && semver.lt(currentVersion, versionRelease)) {
      releaseNotes.push({
        version: versionRelease,
        note: getNoteValue(release),
      })
    }
  }
  return releaseNotes.sort((a, b) => semver.rcompare(a.version, b.version))
}

// addRandomQueryToAvoidCaching is false by default because in most cases URL already contains version number,
// so, it makes sense only for Generic Provider for channel files
function newUrlFromBase(pathname: string, baseUrl: URL, addRandomQueryToAvoidCaching = false): URL {
  const result = new URL(pathname, baseUrl)
  // search is not propagated (search is an empty string if not specified)
  const { search } = baseUrl
  if (search != null && search.length > 0) {
    result.search = search
  } else if (addRandomQueryToAvoidCaching) {
    result.search = `noCache=${Date.now().toString(32)}`
  }
  return result
}

function getChannelFilename(channel: string): string {
  return `${channel}.yml`
}
