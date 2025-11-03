import { fileURLToPath } from "node:url"

import { callWindowExpose } from "@follow/shared/bridge"
import { DEV } from "@follow/shared/constants"
import type { LatestReleasePayload, PlatformUpdate } from "@follow-app/client-sdk"
import type { AppUpdater } from "electron-updater"
import { autoUpdater as defaultAutoUpdater } from "electron-updater"
import { join } from "pathe"

import { WindowManager } from "~/manager/window"
import type { RendererManifest } from "~/updater/hot-updater"
import { RendererEligibilityStatus, rendererUpdater } from "~/updater/hot-updater"

import { channel, isWindows } from "../env"
import { logger } from "../logger"
import { getUpdateInfo } from "./api"
import { appUpdaterConfig } from "./configs"
import { FollowUpdateProvider } from "./follow-update-provider"
import { WindowsUpdater } from "./windows-updater"

type UpdateCheckOptions = {
  refresh?: boolean
}

type UpdateCheckResult = {
  hasUpdate: boolean
  error?: string
}

class FollowUpdater {
  private readonly disabled: boolean
  private checkingUpdate = false
  private downloadingUpdate = false

  private pollingTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly autoUpdater: AppUpdater,
    private readonly renderer = rendererUpdater,
  ) {
    this.disabled = !appUpdaterConfig.enableAppUpdate
  }

  register() {
    if (this.disabled) {
      logger.info("App auto-update disabled; updater not registered")
      return
    }

    this.autoUpdater.autoDownload = false
    this.autoUpdater.allowPrerelease = channel !== "stable"
    this.autoUpdater.autoInstallOnAppQuit = true
    this.autoUpdater.autoRunAppAfterInstall = true
    this.autoUpdater.forceDevUpdateConfig = DEV

    if (import.meta.env.DEV) {
      const __dirname = fileURLToPath(new URL(".", import.meta.url))
      this.autoUpdater.updateConfigPath = join(__dirname, "../../dev-only/dev-app-update.yml")
    }

    this.autoUpdater.setFeedURL({
      provider: "custom",
      updateProvider: FollowUpdateProvider,
    })

    this.registerAutoUpdaterEvents()

    if (appUpdaterConfig.app.autoCheckUpdate) {
      void this.checkForUpdates().catch((error) =>
        logger.error("Initial update check failed", error),
      )
    }

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
    }

    this.pollingTimer = setInterval(() => {
      if (!appUpdaterConfig.app.autoCheckUpdate) {
        return
      }

      void this.checkForUpdates().catch((error) => {
        logger.error("Scheduled update check failed", error)
      })
    }, appUpdaterConfig.app.checkUpdateInterval)
  }

  async checkForUpdates(options: UpdateCheckOptions = {}): Promise<UpdateCheckResult> {
    if (this.disabled) {
      return { hasUpdate: false }
    }

    if (this.checkingUpdate) {
      logger.info("Update check already in progress, skipping")
      return { hasUpdate: false }
    }

    this.checkingUpdate = true

    try {
      const payload = await getUpdateInfo(options.refresh ? { refresh: true } : {})
      const { decision } = payload

      if (!decision || decision.type === "none") {
        logger.info("Update decision: none")
        return { hasUpdate: false }
      }

      if (decision.type === "renderer") {
        logger.info("Update decision: renderer")
        return await this.handleRendererDecision(payload)
      }

      if (decision.type === "app") {
        logger.info("Update decision: app")
        return await this.handleAppDecision(payload)
      }

      logger.warn("Unknown update decision type", { type: decision.type })
      return { hasUpdate: false }
    } catch (error) {
      logger.error("Failed to check for updates", error)
      return { hasUpdate: false, error: error instanceof Error ? error.message : "Unknown error" }
    } finally {
      this.checkingUpdate = false
    }
  }

  async downloadAppUpdate(): Promise<void> {
    if (this.disabled || this.downloadingUpdate) {
      return
    }

    this.downloadingUpdate = true

    try {
      await this.autoUpdater.downloadUpdate()
      logger.info("App update download requested")
    } catch (error) {
      this.downloadingUpdate = false
      logger.error("Failed to download app update", error)
      throw error
    }
  }

  quitAndInstall() {
    const mainWindow = WindowManager.getMainWindow()
    logger.info("Quit and install triggered", { windowId: mainWindow?.id })
    WindowManager.destroyMainWindow()

    setTimeout(() => {
      logger.info("Main window closed, quitting to install update")
      this.autoUpdater.quitAndInstall()
    }, 1000)
  }

  private resolvePlatformCandidates() {
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

  private pickPlatformUpdate(
    platforms: PlatformUpdate[] | null | undefined,
    selected?: PlatformUpdate | null,
  ): PlatformUpdate | null {
    if (!platforms || platforms.length === 0) {
      return null
    }

    if (selected) {
      return selected
    }

    const candidates = this.resolvePlatformCandidates()

    const matched = platforms.find((platform) =>
      candidates.includes(platform.platform.toLowerCase()),
    )

    return matched ?? platforms[0] ?? null
  }

  private async handleAppDecision(payload: LatestReleasePayload): Promise<UpdateCheckResult> {
    const appDecision = payload.decision.app
    if (!appUpdaterConfig.enableCoreUpdate) {
      logger.info("Core app update disabled by configuration")
      return { hasUpdate: false }
    }

    if (!appDecision) {
      logger.warn("App update decision missing app payload")
      return { hasUpdate: false, error: "App update metadata unavailable" }
    }

    const platformUpdate = this.pickPlatformUpdate(
      appDecision.platforms,
      appDecision.selectedPlatform,
    )
    if (!platformUpdate) {
      logger.warn("No matching platform update found", {
        platform: process.platform,
        arch: process.arch,
      })
      return { hasUpdate: false, error: "No installer available for this platform" }
    }

    FollowUpdateProvider.setContext({ payload, platform: platformUpdate })
    logger.info("FollowUpdateProvider context set", { platform: platformUpdate.platform })

    try {
      await this.autoUpdater.checkForUpdates()
    } catch (error) {
      logger.warn(
        "autoUpdater.checkForUpdates failed after preparing FollowUpdateProvider context",
        error,
      )
      return {
        hasUpdate: false,
        error: error instanceof Error ? error.message : "Failed to check app update",
      }
    } finally {
      FollowUpdateProvider.clearContext()
    }

    return { hasUpdate: true }
  }

  private async handleRendererDecision(payload: LatestReleasePayload): Promise<UpdateCheckResult> {
    if (!appUpdaterConfig.enableRenderHotUpdate) {
      logger.info("Renderer hot update disabled; falling back to app decision if present")
      if (payload.decision.app) {
        return this.handleAppDecision(payload)
      }
      return { hasUpdate: false }
    }

    const manifest = this.renderer.extractManifest(payload)
    const eligibility = this.renderer.evaluateManifest(manifest)

    switch (eligibility.status) {
      case RendererEligibilityStatus.NoManifest: {
        return { hasUpdate: false, error: eligibility.reason }
      }

      case RendererEligibilityStatus.AlreadyCurrent: {
        if (eligibility.reason) {
          logger.info(eligibility.reason)
        }
        return { hasUpdate: false }
      }

      case RendererEligibilityStatus.RequiresFullAppUpdate: {
        logger.info(
          eligibility.reason,

          "Renderer payload requires main process update, delegating to app updater",
        )
        if (payload.decision.app) {
          return this.handleAppDecision(payload)
        }
        logger.warn("Renderer update requested full app upgrade but no app payload provided")
        return { hasUpdate: false, error: "Renderer update requires full app upgrade" }
      }

      case RendererEligibilityStatus.Eligible: {
        const manifestToApply = eligibility.manifest as RendererManifest | undefined
        if (!manifestToApply) {
          return { hasUpdate: false }
        }

        try {
          await this.renderer.applyManifest(manifestToApply)
          return { hasUpdate: true }
        } catch (error) {
          logger.error("Renderer hot update failed", error)
          return {
            hasUpdate: false,
            error: error instanceof Error ? error.message : "Renderer hot update failed",
          }
        }
      }

      default: {
        return { hasUpdate: false }
      }
    }
  }

  private registerAutoUpdaterEvents() {
    this.autoUpdater.on("checking-for-update", () => {
      logger.info("autoUpdater: checking for update")
    })

    this.autoUpdater.on("update-available", (info) => {
      logger.info("autoUpdater: update available", info)

      if (appUpdaterConfig.app.autoDownloadUpdate && appUpdaterConfig.enableCoreUpdate) {
        void this.downloadAppUpdate().catch((error) =>
          logger.error("Automatic download failed", error),
        )
      }
    })

    this.autoUpdater.on("update-not-available", (info) => {
      logger.info("autoUpdater: update not available", info)
    })

    this.autoUpdater.on("download-progress", (progress) => {
      logger.info(`autoUpdater: download progress ${progress.percent.toFixed(2)}%`)
    })

    this.autoUpdater.on("update-downloaded", () => {
      this.downloadingUpdate = false
      logger.info("autoUpdater: update downloaded")

      const mainWindow = WindowManager.getMainWindow()
      if (!mainWindow) return

      callWindowExpose(mainWindow).updateDownloaded()
    })

    this.autoUpdater.on("error", (error) => {
      logger.error("autoUpdater: error", error)
    })
  }
}

const autoUpdater = isWindows ? new WindowsUpdater() : defaultAutoUpdater
const followUpdater = new FollowUpdater(autoUpdater)

export const registerUpdater = () => {
  followUpdater.register()
}

export const checkForAppUpdates = (options: UpdateCheckOptions = {}) =>
  followUpdater.checkForUpdates(options)

export const quitAndInstall = () => followUpdater.quitAndInstall()
