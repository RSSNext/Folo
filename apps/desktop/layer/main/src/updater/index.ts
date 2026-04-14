import { fileURLToPath } from "node:url"

import { callWindowExpose } from "@follow/shared/bridge"
import { DEV } from "@follow/shared/constants"
import { version as appVersion } from "@pkg"
import log from "electron-log"
import type { AppUpdater } from "electron-updater"
import { autoUpdater as defaultAutoUpdater } from "electron-updater"
import { join } from "pathe"

import { WindowManager } from "~/manager/window"
import type { RendererManifest } from "~/updater/hot-updater"
import { RendererEligibilityStatus, rendererUpdater } from "~/updater/hot-updater"

import { channel, isWindows } from "../env"
import { fetchDesktopManifest, fetchDesktopPolicy, getDesktopRuntimeVersion } from "./api"
import { appUpdaterConfig } from "./configs"
import { FollowUpdateProvider } from "./follow-update-provider"
import type { DesktopAppPayload, DesktopManifestResponse, DesktopPolicyResponse } from "./types"
import { WindowsUpdater } from "./windows-updater"

const logger = log.scope("app-updater")
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
      logger.info("Initial update check, runtimeVersion:", getDesktopRuntimeVersion())
      void this.checkForUpdates().catch((error) =>
        logger.error("Initial update check failed", error),
      )
    }

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
    }

    const updatePollingHandler = async () => {
      if (!appUpdaterConfig.app.autoCheckUpdate) {
        return
      }

      void this.checkForUpdates().catch((error) => {
        logger.error("Scheduled update check failed", error)
      })
    }
    updatePollingHandler()
    this.pollingTimer = setInterval(updatePollingHandler, appUpdaterConfig.app.checkUpdateInterval)
  }

  async checkForUpdates(_options: UpdateCheckOptions = {}): Promise<UpdateCheckResult> {
    if (this.disabled) {
      return { hasUpdate: false }
    }

    if (this.checkingUpdate) {
      logger.info("Update check already in progress, skipping")
      return { hasUpdate: false }
    }

    this.checkingUpdate = true

    try {
      const [manifest, policy] = await Promise.all([fetchDesktopManifest(), fetchDesktopPolicy()])

      if (appUpdaterConfig.enableDistributionStoreUpdate) {
        logger.info("Distribution store update enabled, checking ota manifest and store policy")
        return this.handleDistributionAppDecision(manifest, policy)
      }

      return this.handleDirectAppDecision(manifest, policy)
    } catch (error) {
      logger.error("Failed to check for updates", error)
      return { hasUpdate: false, error: error instanceof Error ? error.message : "Unknown error" }
    } finally {
      this.checkingUpdate = false
    }
  }

  async handleDirectAppDecision(
    manifest: DesktopManifestResponse | null,
    policy: DesktopPolicyResponse,
  ): Promise<UpdateCheckResult> {
    let rendererResult: UpdateCheckResult | null = null
    let appResult: UpdateCheckResult | null = null

    if (manifest?.renderer) {
      logger.info("Update decision: renderer")
      rendererResult = await this.handleRendererDecision(manifest, manifest.app)
      if (rendererResult.hasUpdate) {
        return rendererResult
      }
    }

    if (manifest?.app) {
      logger.info("Update decision: app")
      appResult = await this.handleAppDecision(manifest.app)
      if (appResult.hasUpdate) {
        return appResult
      }
    }

    const result = finalizeDirectUpdateResult({
      rendererResult,
      appResult,
      policy,
    })

    if (result.hasUpdate && policy.distribution === "direct" && policy.downloadUrl) {
      logger.info("Direct binary policy available", {
        action: policy.action,
        downloadUrl: policy.downloadUrl,
      })
      await this.notifyDistributionUpdate(policy)
    } else if (result.hasUpdate && policy.distribution === "direct") {
      logger.info("Direct binary policy available", {
        action: policy.action,
        downloadUrl: null,
      })
    } else if (!result.hasUpdate) {
      logger.info("Update decision: none")
    }

    return result
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

  private async handleAppDecision(
    appDecision: DesktopAppPayload | null,
  ): Promise<UpdateCheckResult> {
    if (!appUpdaterConfig.enableCoreUpdate) {
      logger.info("Core app update disabled by configuration")
      return { hasUpdate: false }
    }

    if (!appDecision) {
      logger.warn("App update decision missing app payload")
      return { hasUpdate: false, error: "App update metadata unavailable" }
    }

    FollowUpdateProvider.setContext({ app: appDecision })
    logger.info("FollowUpdateProvider context set", { platform: appDecision.platform })

    try {
      const result = await this.autoUpdater.checkForUpdates()
      return { hasUpdate: result?.isUpdateAvailable ?? false }
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
  }

  private async handleDistributionAppDecision(
    manifest: DesktopManifestResponse | null,
    policy: DesktopPolicyResponse,
  ): Promise<UpdateCheckResult> {
    try {
      if (!appUpdaterConfig.enableDistributionStoreUpdate) {
        return { hasUpdate: false }
      }

      const rendererResult = await this.tryDistributionRendererUpdate(manifest)
      if (rendererResult) {
        return rendererResult
      }

      if (!this.shouldPromptDistributionStoreUpdate(policy)) {
        logger.info("Distribution update does not require store action")
        return { hasUpdate: false }
      }

      logger.info("Distribution store update required")
      return await this.notifyDistributionUpdate(policy)
    } catch (error) {
      logger.error("Failed to handle distribution app update", error)
      return {
        hasUpdate: false,
        error: error instanceof Error ? error.message : "Failed to handle distribution update",
      }
    }
  }

  private async tryDistributionRendererUpdate(
    manifestResponse: DesktopManifestResponse | null,
  ): Promise<UpdateCheckResult | null> {
    const renderer = manifestResponse?.renderer ?? null
    if (!renderer) {
      return null
    }

    if (!appUpdaterConfig.enableRenderHotUpdate) {
      logger.info("Renderer hot update disabled for distribution build")
      return null
    }

    const manifest = this.renderer.extractManifestFromRendererUpdate(
      renderer,
      manifestResponse?.runtimeVersion ?? getDesktopRuntimeVersion(),
    )
    if (!manifest) {
      logger.warn("Distribution renderer update missing manifest")
      return null
    }

    const eligibility = this.renderer.evaluateManifest(manifest)

    switch (eligibility.status) {
      case RendererEligibilityStatus.NoManifest: {
        if (eligibility.reason) {
          logger.warn("Distribution renderer update missing manifest data", {
            reason: eligibility.reason,
          })
        }
        return null
      }

      case RendererEligibilityStatus.AlreadyCurrent: {
        if (eligibility.reason) {
          logger.info(eligibility.reason)
        }
        return { hasUpdate: false }
      }

      case RendererEligibilityStatus.RequiresFullAppUpdate: {
        logger.info(
          eligibility.reason ??
            "Renderer payload requires main process update, delegating to distribution store flow",
        )
        return null
      }

      case RendererEligibilityStatus.Eligible: {
        const manifestToApply = eligibility.manifest as RendererManifest | undefined
        if (!manifestToApply) {
          logger.warn("Distribution renderer update missing manifest payload")
          return null
        }

        try {
          await this.renderer.applyManifest(manifestToApply)
          return { hasUpdate: true }
        } catch (error) {
          logger.error("Renderer hot update failed for distribution build", error)
          return {
            hasUpdate: false,
            error: error instanceof Error ? error.message : "Renderer hot update failed",
          }
        }
      }

      default: {
        return null
      }
    }
  }

  private shouldPromptDistributionStoreUpdate(info: DesktopPolicyResponse): boolean {
    if (info.distribution === "direct") {
      return false
    }

    if (!info.storeUrl) {
      logger.info("Distribution store update skipped: missing store URL", {
        distribution: info.distribution,
      })
      return false
    }

    return info.action !== "none"
  }

  private async notifyDistributionUpdate(info: DesktopPolicyResponse): Promise<UpdateCheckResult> {
    const mainWindow = WindowManager.getMainWindow()
    if (!mainWindow) {
      logger.warn("Main window unavailable when notifying distribution update")
      return { hasUpdate: true }
    }

    const targetUrl = info.distribution === "direct" ? info.downloadUrl : info.storeUrl

    if (!targetUrl) {
      logger.warn("Distribution update missing target URL", {
        distribution: info.distribution,
      })
      return { hasUpdate: false }
    }

    await callWindowExpose(mainWindow).distributionUpdateAvailable({
      distribution: info.distribution,
      targetUrl,
      storeVersion: info.targetVersion ?? null,
      currentVersion: appVersion,
    })

    return { hasUpdate: true }
  }

  private async handleRendererDecision(
    manifestResponse: DesktopManifestResponse | null,
    fallbackApp: DesktopAppPayload | null,
  ): Promise<UpdateCheckResult> {
    if (!appUpdaterConfig.enableRenderHotUpdate) {
      logger.info("Renderer hot update disabled; falling back to app decision if present")
      if (fallbackApp) {
        return this.handleAppDecision(fallbackApp)
      }
      return { hasUpdate: false }
    }

    const manifest = this.renderer.extractManifest(manifestResponse)
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
        if (fallbackApp) {
          return this.handleAppDecision(fallbackApp)
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

    this.autoUpdater.on("update-downloaded", (ev) => {
      this.downloadingUpdate = false
      logger.info("autoUpdater: update downloaded", ev.downloadedFile, ev.version)

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

export function finalizeDirectUpdateResult(input: {
  rendererResult?: UpdateCheckResult | null
  appResult?: UpdateCheckResult | null
  policy: DesktopPolicyResponse
}) {
  if (input.rendererResult?.hasUpdate) {
    return input.rendererResult
  }

  if (input.appResult?.hasUpdate) {
    return input.appResult
  }

  const lastError = input.appResult?.error ?? input.rendererResult?.error

  if (
    input.policy.action !== "none" &&
    input.policy.distribution === "direct" &&
    input.policy.downloadUrl
  ) {
    return { hasUpdate: true }
  }

  return { hasUpdate: false, ...(lastError ? { error: lastError } : {}) }
}

export const registerUpdater = () => {
  followUpdater.register()
}

export const checkForAppUpdates = (options: UpdateCheckOptions = {}) =>
  followUpdater.checkForUpdates(options)

export const quitAndInstall = () => followUpdater.quitAndInstall()
