import os from "node:os"

import path from "pathe"

import { downloadFileWithProgress } from "~/lib/download"

import { logger } from "./logger"
import type { RenderManifest } from "./manifest"
import { getFileDownloadUrl } from "./manifest"

const downloadTempDir = path.resolve(os.tmpdir(), "follow-render-update")

export const downloadRenderAsset = async (manifest: RenderManifest) => {
  const { filename } = manifest
  const url = await getFileDownloadUrl(filename)
  const filePath = path.resolve(downloadTempDir, filename)

  logger.info(`Downloading ${url}, Save to ${filePath}`)

  const success = await downloadFileWithProgress({
    url,
    outputPath: filePath,
    expectedHash: manifest.hash,

    onLog: (message) => {
      logger.info(message)
    },
  })
  if (!success) throw new Error("Download hot update render asset failed")
  return filePath
}
