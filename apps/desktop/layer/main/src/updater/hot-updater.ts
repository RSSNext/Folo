import { existsSync, readFileSync } from "node:fs"
import { mkdir, mkdtemp, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import { URL } from "node:url"

import { callWindowExpose } from "@follow/shared/bridge"
import { runtimeVersion as configuredRuntimeVersion, version as appVersion } from "@pkg"
import log from "electron-log"
import { dump, load } from "js-yaml"
import path from "pathe"
import { x } from "tar"

import { HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"
import { downloadFileWithProgress } from "~/lib/download"
import { WindowManager } from "~/manager/window"

import { appUpdaterConfig } from "./configs"
import type { DesktopManifestResponse, DesktopRendererPayload } from "./types"
import { manifestHashToHex } from "./types"

export type RendererManifest = {
  runtimeVersion: string
  version: string
  releaseVersion: string
  commit: string
  downloadUrl: string
  hash: string
  filename: string
  downloadedAt?: string
}

export enum RendererEligibilityStatus {
  NoManifest,
  RequiresFullAppUpdate,
  AlreadyCurrent,
  Eligible,
}

export interface RendererEligibilityResult {
  status: RendererEligibilityStatus
  manifest?: RendererManifest
  reason?: string
}

class RendererHotUpdater {
  private readonly logger = log.scope("updater:renderer")
  private readonly tempDir = path.resolve(os.tmpdir(), "follow-render-update")
  private readonly manifestPath = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "manifest.yml")

  extractManifest(payload: DesktopManifestResponse | null): RendererManifest | null {
    if (!payload) return null

    return this.toManifest(payload.renderer, payload.runtimeVersion)
  }

  extractManifestFromRendererUpdate(
    renderer: DesktopRendererPayload | null,
    runtimeVersion: string,
  ): RendererManifest | null {
    return this.toManifest(renderer, runtimeVersion)
  }

  evaluateManifest(manifest: RendererManifest | null): RendererEligibilityResult {
    if (!manifest) {
      return { status: RendererEligibilityStatus.NoManifest }
    }

    const appRuntimeVersion = configuredRuntimeVersion ?? appVersion
    if (manifest.runtimeVersion !== appRuntimeVersion) {
      return {
        status: RendererEligibilityStatus.RequiresFullAppUpdate,
        manifest,
        reason: `Renderer payload requires runtimeVersion ${manifest.runtimeVersion}, current runtimeVersion is ${appRuntimeVersion}`,
      }
    }

    if (manifest.version === appVersion) {
      return {
        status: RendererEligibilityStatus.AlreadyCurrent,
        reason: "Renderer version matches current app version",
      }
    }

    const installedManifest = this.getCurrentManifest()
    if (installedManifest && installedManifest.version === manifest.version) {
      return {
        status: RendererEligibilityStatus.AlreadyCurrent,
        reason: "Installed renderer manifest already at target version",
      }
    }

    return {
      status: RendererEligibilityStatus.Eligible,
      manifest,
    }
  }

  private toManifest(
    renderer: DesktopRendererPayload | null,
    runtimeVersion: string,
  ): RendererManifest | null {
    if (!renderer) {
      this.logger.debug("Renderer decision payload missing renderer field")
      return null
    }

    if (!renderer.launchAsset?.url) {
      this.logger.warn("Renderer decision missing downloadUrl, skip renderer hot update")
      return null
    }

    const filename = this.resolveFilename(renderer.launchAsset.url)
    if (!filename) {
      this.logger.warn("Renderer decision missing filename, skip renderer hot update")
      return null
    }

    if (!renderer.launchAsset.hash) {
      this.logger.warn("Renderer decision missing hash, skip renderer hot update")
      return null
    }

    return {
      runtimeVersion,
      version: renderer.version,
      releaseVersion: renderer.releaseVersion,
      commit: renderer.commit,
      downloadUrl: renderer.launchAsset.url,
      filename,
      hash: manifestHashToHex(renderer.launchAsset.hash),
    }
  }

  async applyManifest(manifest: RendererManifest): Promise<void> {
    if (!appUpdaterConfig.enableRenderHotUpdate) {
      this.logger.info("Renderer hot update skipped because it is disabled in config")
      return
    }

    const archivePath = await this.downloadArchive(manifest)
    const stagingRoot = await mkdtemp(path.resolve(this.tempDir, "extract-"))
    const stagingDir = path.resolve(stagingRoot, "content")

    await mkdir(stagingDir, { recursive: true })
    this.logger.info(`Extracting renderer bundle to ${stagingDir}`)

    await x({
      f: archivePath,
      cwd: stagingDir,
    })

    const extractedDir = path.resolve(stagingDir, "renderer")
    const targetDir = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, manifest.version)

    const extractedStats = await stat(extractedDir).catch(() => null)
    if (!extractedStats) {
      throw new Error(`Extracted renderer directory not found at ${extractedDir}`)
    }

    await rm(targetDir, { recursive: true, force: true })
    await mkdir(HOTUPDATE_RENDER_ENTRY_DIR, { recursive: true })
    await rename(extractedDir, targetDir)

    await this.writeManifest({ ...manifest, downloadedAt: new Date().toISOString() })

    try {
      await rm(archivePath, { force: true })
    } catch (error) {
      this.logger.warn("Failed to clean renderer archive", error)
    }

    try {
      await rm(stagingRoot, { recursive: true, force: true })
    } catch (error) {
      this.logger.warn("Failed to clean renderer staging directory", error)
    }

    this.logger.info(`Renderer hot update applied successfully: ${manifest.version}`)

    const mainWindow = WindowManager.getMainWindow()
    if (mainWindow) {
      callWindowExpose(mainWindow).readyToUpdate()
    }
  }

  getCurrentManifest(): RendererManifest | null {
    if (!existsSync(this.manifestPath)) {
      return null
    }

    try {
      const content = readFileSync(this.manifestPath, "utf-8")
      const parsed = load(content)
      if (parsed && typeof parsed === "object") {
        return parsed as RendererManifest
      }
    } catch (error) {
      this.logger.warn("Failed to read renderer manifest from disk", error)
    }

    return null
  }

  async cleanup(): Promise<void> {
    const manifest = this.getCurrentManifest()
    if (!manifest) {
      await rm(HOTUPDATE_RENDER_ENTRY_DIR, { recursive: true, force: true })
      return
    }

    const keepDir = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, manifest.version)
    let entries: string[] = []

    try {
      entries = await readdir(HOTUPDATE_RENDER_ENTRY_DIR)
    } catch (error) {
      this.logger.warn("Failed to read renderer directory for cleanup", error)
      return
    }

    await Promise.all(
      entries.map(async (entryName) => {
        const entryPath = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, entryName)
        const entryStat = await stat(entryPath).catch(() => null)
        if (!entryStat?.isDirectory()) return
        if (entryPath === keepDir) return
        await rm(entryPath, { recursive: true, force: true })
      }),
    )
  }

  loadDynamicEntry() {
    if (!appUpdaterConfig.enableRenderHotUpdate) return

    const manifest = this.getCurrentManifest()
    if (!manifest) return

    const dir = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, manifest.version)
    const entryFile = path.resolve(dir, "index.html")
    if (!existsSync(entryFile)) return

    return entryFile
  }

  private async downloadArchive(manifest: RendererManifest) {
    const archivePath = path.resolve(this.tempDir, manifest.filename)

    this.logger.info(
      `Downloading renderer bundle ${manifest.filename} from ${manifest.downloadUrl}`,
    )

    const success = await downloadFileWithProgress({
      url: manifest.downloadUrl,
      outputPath: archivePath,
      expectedHash: manifest.hash,
      onLog: (message) => this.logger.info(message),
    })

    if (!success) {
      throw new Error("Failed to download renderer bundle")
    }

    return archivePath
  }

  private async writeManifest(manifest: RendererManifest) {
    await writeFile(this.manifestPath, dump(manifest), "utf-8")
  }

  private resolveFilename(url: string) {
    try {
      return new URL(url).pathname.split("/").pop() ?? null
    } catch {
      return null
    }
  }
}

export const rendererUpdater = new RendererHotUpdater()

export const getCurrentRendererManifest = () => rendererUpdater.getCurrentManifest()

export const cleanupOldRenderer = async () => {
  await rendererUpdater.cleanup()
}

export const cleanupOldRender = cleanupOldRenderer

export const loadDynamicRenderEntry = () => rendererUpdater.loadDynamicEntry()
