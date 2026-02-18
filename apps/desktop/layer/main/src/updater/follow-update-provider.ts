import { URL } from "node:url"

import type {
  AppUpdate,
  LatestReleasePayload,
  PlatformUpdate,
  PlatformUpdateFile,
} from "@follow-app/client-sdk"
import type { UpdateFileInfo, UpdateInfo } from "builder-util-runtime"
import { newError } from "builder-util-runtime"
import type { AppUpdater } from "electron-updater"
import type { ProviderRuntimeOptions } from "electron-updater/out/providers/Provider"
import { Provider } from "electron-updater/out/providers/Provider"
import type { ResolvedUpdateFileInfo } from "electron-updater/out/types"

import { logger } from "../logger"
import { getUpdateInfo } from "./api"

interface FollowProviderOptions {
  provider: "custom"
}

type FollowProviderContext = {
  payload: LatestReleasePayload
  platform: PlatformUpdate
}

export class FollowUpdateProvider extends Provider<UpdateInfo> {
  private static context: FollowProviderContext | null = null

  static setContext(context: FollowProviderContext) {
    FollowUpdateProvider.context = context
  }

  static clearContext() {
    FollowUpdateProvider.context = null
  }

  static getContext() {
    return FollowUpdateProvider.context
  }

  constructor(
    _options: FollowProviderOptions,
    _updater: AppUpdater,
    runtimeOptions: ProviderRuntimeOptions,
  ) {
    super(runtimeOptions)
  }

  async getLatestVersion(): Promise<UpdateInfo> {
    const context = await this.ensureContext()
    return this.buildUpdateInfo(context)
  }

  resolveFiles(updateInfo: UpdateInfo): Array<ResolvedUpdateFileInfo> {
    return updateInfo.files.map((file) => ({
      info: file,
      url: new URL(file.url),
    }))
  }

  private buildUpdateInfo(context: FollowProviderContext): UpdateInfo {
    const { payload, platform } = context
    const files = this.mapFiles(platform.files)

    if (files.length === 0) {
      throw newError(
        `No downloadable files found for platform ${platform.platform}`,
        "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND",
      )
    }

    const primaryFile = files[0]
    if (!primaryFile) {
      throw newError(
        `Platform ${platform.platform} provides no downloadable file`,
        "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND",
      )
    }

    let primaryPath = primaryFile.url
    const primaryUrl = this.safeParseUrl(primaryFile.url)
    if (primaryUrl) {
      const filename = primaryUrl.pathname.split("/").pop()
      if (filename) {
        primaryPath = filename
      }
    }

    const { release } = payload

    return {
      version: platform.version,
      files,
      path: primaryPath,
      sha512: primaryFile.sha512,
      releaseName: release.name,
      releaseNotes: release.body,
      releaseDate: platform.releaseDate || release.publishedAt || new Date().toISOString(),
    }
  }

  private mapFiles(files: PlatformUpdate["files"]): UpdateFileInfo[] {
    if (!files) return []

    return files
      .map((file) => this.mapFile(file))
      .filter((file): file is UpdateFileInfo => file !== null)
  }

  private mapFile(file: PlatformUpdateFile): UpdateFileInfo | null {
    if (!file.downloadUrl || !file.sha512) {
      logger.warn("Skip platform file without downloadUrl or sha512", file)
      return null
    }

    const mapped: UpdateFileInfo = {
      url: file.downloadUrl,
      sha512: file.sha512,
    }

    if (typeof file.size === "number") {
      mapped.size = file.size
    }

    return mapped
  }

  private safeParseUrl(value: string): URL | null {
    try {
      return new URL(value)
    } catch (error) {
      logger.debug?.("Unable to parse update file URL", error)
      return null
    }
  }

  private async ensureContext(): Promise<FollowProviderContext> {
    const context = FollowUpdateProvider.getContext()
    if (context) return context

    const fetched = await this.fetchContext()
    FollowUpdateProvider.setContext(fetched)
    return fetched
  }

  private async fetchContext(): Promise<FollowProviderContext> {
    const payload = await getUpdateInfo({})
    const { decision } = payload

    if (!decision || decision.type !== "app" || !decision.app) {
      throw newError(
        "No app update metadata available from provider",
        "ERR_UPDATER_NO_PUBLISHED_VERSIONS",
      )
    }

    const platform = this.pickPlatform(decision.app)
    if (!platform) {
      throw newError(
        `No matching platform update for ${process.platform}/${process.arch}`,
        "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND",
      )
    }

    return { payload, platform }
  }

  private pickPlatform(appDecision: AppUpdate): PlatformUpdate | null {
    const platforms = appDecision.platforms ?? []
    const selected = appDecision.selectedPlatform
    if (selected) {
      return selected
    }

    const candidates = this.resolvePlatformCandidates()
    const matched = platforms.find((platform) =>
      candidates.includes(platform.platform.toLowerCase()),
    )

    return matched ?? platforms[0] ?? null
  }

  private resolvePlatformCandidates(): string[] {
    const base = new Set<string>()
    base.add(process.platform)
    base.add(`${process.platform}-${process.arch}`)
    base.add(process.arch)

    if (process.platform === "darwin") {
      base.add("mac")
      base.add("macos")
    }

    if (process.platform === "win32") {
      base.add("windows")
      base.add("win")
    }

    return Array.from(base).map((value) => value.toLowerCase())
  }
}
