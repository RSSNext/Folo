import { existsSync, readFileSync } from "node:fs"

import { mainHash, version as appVersion } from "@pkg"
import { load } from "js-yaml"
import path from "pathe"

import { HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"

import { logger } from "./logger"
import type { RenderManifest } from "./manifest"
import { fetchLatestManifest } from "./manifest"

export enum CanUpdateRenderState {
  // If version is equal, no need to update
  NO_NEEDED,
  // Can be only update render layer, not fully upgrade app
  NEEDED,
  // App not support, should trigger app force update
  APP_NOT_SUPPORT,
  // Network error, can't fetch manifest
  NETWORK_ERROR,
}

export const canUpdateRender = async (): Promise<[CanUpdateRenderState, RenderManifest | null]> => {
  const manifest = await fetchLatestManifest()

  logger.info("fetched manifest", manifest)

  if (!manifest) return [CanUpdateRenderState.NETWORK_ERROR, null]

  const appSupport = mainHash === manifest.mainHash
  if (!appSupport) {
    logger.info("app not support, should trigger app force update, app version: ", appVersion)
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

  const oldManifest: RenderManifest | null = manifestExist
    ? (load(readFileSync(manifestFilePath, "utf-8")) as RenderManifest)
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
