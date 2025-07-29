/**
 * @description This file handles hot updates for the electron renderer layer
 */
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"

import { callWindowExpose } from "@follow/shared/bridge"
import { mainHash, version as appVersion } from "@pkg"
import log from "electron-log"
import { load } from "js-yaml"
import path from "pathe"
import { x } from "tar"

import { GITHUB_OWNER, GITHUB_REPO, HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { appUpdaterConfig } from "./configs"

const logger = log.scope("hot-updater")

const url = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
const releasesUrl = `${url}/releases`
const releaseApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`

const getLatestReleaseTag = async () => {
  // Get all releases and filter for desktop releases only
  const res = await fetch(releaseApiUrl)
  const releases = await res.json()

  // Filter for desktop releases and find the latest one
  const desktopReleases = releases.filter(
    (release: any) => release.tag_name.startsWith("desktop/") && !release.draft,
  )

  if (desktopReleases.length === 0) {
    throw new Error("No desktop releases found")
  }

  // Return the most recent desktop release (GitHub orders by created_at desc)
  return desktopReleases[0].tag_name
}

const getFileDownloadUrl = async (filename: string) => {
  const tag = await getLatestReleaseTag()

  return `${releasesUrl}/download/${tag}/${filename}`
}

type Manifest = {
  /** Render  version */
  version: string
  hash: string
  commit: string
  filename: string
  /** Only electron main hash equal to this value, renderer will can be updated */
  mainHash: string
}
const getLatestReleaseManifest = async () => {
  const url = await getFileDownloadUrl("manifest.yml")
  logger.info(`Fetching manifest from ${url}`)
  const res = await fetch(url)
  const text = await res.text()
  const manifest = load(text) as Manifest
  if (typeof manifest !== "object") {
    logger.error("Invalid manifest", text)
    return null
  }
  return manifest
}
const downloadTempDir = path.resolve(os.tmpdir(), "follow-render-update")

export enum CanUpdateRenderState {
  // If version is equal, no need to update
  NO_NEEDED,
  // Can be only update render layer, not fully upgrade app
  NEEDED,
  // App not support, should trigger app force update
  APP_NOT_SUPPORT,
  // Network error, can fetch manifest
  NETWORK_ERROR,
}
export const canUpdateRender = async (): Promise<[CanUpdateRenderState, Manifest | null]> => {
  const manifest = await getLatestReleaseManifest()

  logger.info("fetched manifest", manifest)

  if (!manifest) return [CanUpdateRenderState.NETWORK_ERROR, null]

  // const isAppShouldUpdate = shouldUpdateApp(appVersion, manifest.version)
  // if (isAppShouldUpdate) {
  //   logger.info(
  //     "app should update, skip render update, app version: ",
  //     appVersion,
  //     ", the manifest version: ",
  //     manifest.version,
  //   )
  //   return false
  // }

  const appSupport = mainHash === manifest.mainHash
  if (!appSupport) {
    logger.info("app not support, should trigger app force update, app version: ", appVersion)
    // hotUpdateAppNotSupportTriggerTrack({
    //   appVersion,
    //   manifestVersion: manifest.version,
    // })
    // // Trigger app force update
    // checkForAppUpdates().then(() => {
    //   downloadAppUpdate()
    // })
    return [CanUpdateRenderState.APP_NOT_SUPPORT, null]
  }

  const isVersionEqual = appVersion === manifest.version
  if (isVersionEqual) {
    logger.info("version is equal, skip update")
    return [CanUpdateRenderState.NO_NEEDED, null]
  }
  const isCommitEqual = GIT_COMMIT_HASH === manifest.commit
  if (isCommitEqual) {
    logger.info("commit is equal, skip update")
    return [CanUpdateRenderState.NO_NEEDED, null]
  }

  const manifestFilePath = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "manifest.yml")
  const manifestExist = existsSync(manifestFilePath)

  const oldManifest: Manifest | null = manifestExist
    ? (load(readFileSync(manifestFilePath, "utf-8")) as Manifest)
    : null

  if (oldManifest) {
    if (oldManifest.version === manifest.version) {
      logger.info("manifest version is equal, skip update")
      return [CanUpdateRenderState.NO_NEEDED, null]
    }
    if (oldManifest.commit === manifest.commit) {
      logger.info("manifest commit is equal, skip update")
      return [CanUpdateRenderState.NO_NEEDED, null]
    }
  }
  return [CanUpdateRenderState.NEEDED, manifest]
}
const downloadRenderAsset = async (manifest: Manifest) => {
  const { filename } = manifest
  const url = await getFileDownloadUrl(filename)

  logger.info(`Downloading ${url}`)
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filePath = path.resolve(downloadTempDir, filename)
  await mkdir(downloadTempDir, { recursive: true })
  await writeFile(filePath, buffer)

  const sha256 = createHash("sha256")
  sha256.update(buffer)
  const hash = sha256.digest("hex")
  if (hash !== manifest.hash) {
    logger.error("Hash mismatch", hash, manifest.hash)
    return false
  }
  return filePath
}
export const hotUpdateRender = async (manifest: Manifest) => {
  if (!appUpdaterConfig.enableRenderHotUpdate) return false

  if (!manifest) return false

  const filePath = await downloadRenderAsset(manifest)
  if (!filePath) return false

  // Extract the tar.gz file
  await mkdir(HOTUPDATE_RENDER_ENTRY_DIR, { recursive: true })
  await x({
    f: filePath,
    cwd: HOTUPDATE_RENDER_ENTRY_DIR,
  })

  // Rename `renderer` folder to `manifest.version`
  await rename(
    path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "renderer"),
    path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, manifest.version),
  )

  await writeFile(
    path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "manifest.yml"),
    JSON.stringify(manifest),
  )
  logger.info(`Hot update render success, update to ${manifest.version}`)

  const mainWindow = WindowManager.getMainWindow()
  if (!mainWindow) return false
  const caller = callWindowExpose(mainWindow)
  caller.readyToUpdate()
  return true
}

export const getCurrentRenderManifest = () => {
  const manifestFilePath = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, "manifest.yml")
  const manifestExist = existsSync(manifestFilePath)
  if (!manifestExist) return null
  return load(readFileSync(manifestFilePath, "utf-8")) as Manifest
}
export const cleanupOldRender = async () => {
  const manifest = getCurrentRenderManifest()
  if (!manifest) {
    // Empty the directory
    await rm(HOTUPDATE_RENDER_ENTRY_DIR, { recursive: true, force: true })
    return
  }

  const currentRenderVersion = manifest.version
  // Clean all not current version
  const dirs = await readdir(HOTUPDATE_RENDER_ENTRY_DIR)
  for (const dir of dirs) {
    const isDir = (await stat(path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, dir))).isDirectory()
    if (!isDir) continue
    if (dir === currentRenderVersion) continue
    await rm(path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, dir), { recursive: true, force: true })
  }
}

export const loadDynamicRenderEntry = () => {
  if (!appUpdaterConfig.enableRenderHotUpdate) return
  const manifest = getCurrentRenderManifest()
  if (!manifest) return
  // check main hash is equal to manifest.mainHash
  const appSupport = mainHash === manifest.mainHash
  if (!appSupport) return

  const currentRenderVersion = manifest.version
  const dir = path.resolve(HOTUPDATE_RENDER_ENTRY_DIR, currentRenderVersion)
  const entryFile = path.resolve(dir, "index.html")
  const entryFileExists = existsSync(entryFile)

  if (!entryFileExists) return
  return entryFile
}
