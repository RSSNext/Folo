import { mkdir, rename, writeFile } from "node:fs/promises"

import { callWindowExpose } from "@follow/shared/bridge"
import path from "pathe"
import { x } from "tar"

import { HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { appUpdaterConfig } from "../configs"
import { downloadRenderAsset } from "./download"
import { logger } from "./logger"
import type { RenderManifest } from "./manifest"

export const hotUpdateRender = async (manifest: RenderManifest) => {
  if (!appUpdaterConfig.enableRenderHotUpdate) return false

  if (!manifest) return false

  const filePath = await downloadRenderAsset(manifest)
  logger.info(`Downloaded render asset to ${filePath}`)
  if (!filePath) return false

  // Extract the tar.gz file
  await mkdir(HOTUPDATE_RENDER_ENTRY_DIR, { recursive: true })
  logger.info(`Extracting render asset to ${HOTUPDATE_RENDER_ENTRY_DIR}`)
  await x({
    f: filePath,
    cwd: HOTUPDATE_RENDER_ENTRY_DIR,
  })

  logger.info(
    `Extracted render asset to ${HOTUPDATE_RENDER_ENTRY_DIR}, rename to ${manifest.version}`,
  )

  // Rename `renderer` folder to `manifest.version`
  await rename(
    path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "renderer"),
    path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, manifest.version),
  )

  const manifestPath = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "manifest.yml")
  logger.info(`Write manifest to ${manifestPath}`)

  await writeFile(manifestPath, JSON.stringify(manifest))
  logger.info(`Hot update render success, update to ${manifest.version}`)

  const mainWindow = WindowManager.getMainWindow()
  if (!mainWindow) return false
  const caller = callWindowExpose(mainWindow)
  caller.readyToUpdate()
  return true
}
