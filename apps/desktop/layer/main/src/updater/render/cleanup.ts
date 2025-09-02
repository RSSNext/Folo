import { readdir, rm, stat } from "node:fs/promises"

import path from "pathe"

import { HOTUPDATE_RENDER_ENTRY_DIR } from "~/constants/app"

import { getCurrentManifest } from "./manifest"

export const cleanupOldRender = async () => {
  const manifest = getCurrentManifest()
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
