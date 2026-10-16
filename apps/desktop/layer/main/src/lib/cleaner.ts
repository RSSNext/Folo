import fsp from "node:fs/promises"

import { callWindowExpose } from "@follow/shared/bridge"
import { app, dialog } from "electron"
import path from "pathe"

import { getIconPath } from "~/helper"
import { logger } from "~/logger"
import { WindowManager } from "~/manager/window"

import { t } from "./i18n"
import { store, StoreKey } from "./store"

const getFolderSize = async (dir: string): Promise<number> => {
  try {
    const files = await fsp.readdir(dir, { withFileTypes: true })
    const sizes = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file.name)

        if (file.isSymbolicLink()) {
          return 0
        }

        if (file.isDirectory()) {
          return await getFolderSize(filePath)
        }

        if (file.isFile()) {
          try {
            const { size } = await fsp.stat(filePath)
            return size
          } catch {
            return 0
          }
        }
        return 0
      }),
    )
    return sizes.reduce((acc, size) => acc + size, 0)
  } catch {
    return 0
  }
}

export const clearAllDataAndConfirm = async () => {
  const win = WindowManager.getMainWindow()
  if (!win) return

  // Dialog to confirm
  const result = await dialog.showMessageBox({
    type: "warning",
    icon: getIconPath(),
    message: t("dialog.clearAllData"),
    buttons: [t("dialog.yes"), t("dialog.no")],
    cancelId: 1,
  })

  if (result.response === 1) {
    return
  }
  return clearAllData()
}

export const clearAllData = async () => {
  const win = WindowManager.getMainWindow()
  if (!win) return
  const ses = win.webContents.session
  const caller = callWindowExpose(win)

  try {
    await ses.clearCache()

    await ses.clearStorageData({
      storages: [
        "filesystem",
        "indexdb",
        "localstorage",
        "shadercache",
        "serviceworkers",
        "cookies",
      ],
    })

    caller.toast.success(t("dialog.clearAllDataSuccess"))

    // reload the app
    win.reload()
  } catch (error: any) {
    caller.toast.error(t("dialog.clearAllDataFailed", { message: error.message }))
  }
}

// Chromium's HTTP cache. The name is capitalized, which matters on Linux.
export const getCacheDir = () => path.join(app.getPath("userData"), "Cache")

export const getCacheSize = async () => {
  const cachePath = getCacheDir()

  // Size is in bytes
  const sizeInBytes = await getFolderSize(cachePath).catch((error) => {
    logger.error(error)
  })
  return sizeInBytes || 0
}

interface CachedFile {
  path: string
  size: number
  modifiedAt: number
}

const getCachedFilesRecursive = async (dir: string, result: CachedFile[] = []) => {
  const files = await fsp.readdir(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = await fsp.stat(filePath).catch(() => null)
    if (!stat) continue
    if (stat.isDirectory()) {
      await getCachedFilesRecursive(filePath, result)
    } else if (!file.startsWith("index")) {
      // The cache index is rewritten all the time and is not an entry to evict
      result.push({ path: filePath, size: stat.size, modifiedAt: stat.mtimeMs })
    }
  }
  return result
}

let timer: any = null

export const clearCacheCronJob = () => {
  if (timer) {
    timer = clearInterval(timer)
  }
  timer = setInterval(
    async () => {
      const hasLimit = store.get(StoreKey.CacheSizeLimit)

      if (!hasLimit) {
        return
      }

      const cacheSize = await getCacheSize()

      const limitByteSize = hasLimit * 1024 * 1024
      if (cacheSize > limitByteSize) {
        // Down to 50MB below the limit, so the next round doesn't start over right away
        const shouldCleanSize = cacheSize - limitByteSize + 1024 * 1024 * 50

        const files = await getCachedFilesRecursive(getCacheDir()).catch(() => [])
        // Oldest first: the files used least recently go
        files.sort((a, b) => a.modifiedAt - b.modifiedAt)

        let cleanedSize = 0
        for (const file of files) {
          try {
            await fsp.rm(file.path, { force: true })
            cleanedSize += file.size
            if (cleanedSize >= shouldCleanSize) {
              break
            }
          } catch (error) {
            logger.error(`Failed to delete cache file ${file.path}:`, error)
          }
        }
        logger.info(`Cleaned ${cleanedSize} bytes cache`)
      }
    },
    10 * 60 * 1000,
  ) // 10 min

  return () => {
    if (!timer) return
    timer = clearInterval(timer)
  }
}

export const checkAndCleanCodeCache = async () => {
  const cachePath = path.join(app.getPath("userData"), "Code Cache")

  const size = await getFolderSize(cachePath).catch((error) => {
    logger.error(error)
  })

  if (!size) return

  const threshold = 1024 * 1024 * 100 // 100MB
  if (size > threshold) {
    await fsp
      .rm(cachePath, { force: true, recursive: true })
      .then(() => {
        logger.info(`Cleaned ${size} bytes code cache`)
      })
      .catch((error) => {
        logger.error(`clean code cache failed: ${error.message}`)
      })
  }
}
