import { existsSync } from "node:fs"

import { mainHash } from "@pkg"
import path from "pathe"

import { HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"

import { appUpdaterConfig } from "../configs"
import { getCurrentManifest } from "./manifest"

export const loadDynamicRenderEntry = () => {
  if (!appUpdaterConfig.enableRenderHotUpdate) return
  const manifest = getCurrentManifest()
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
