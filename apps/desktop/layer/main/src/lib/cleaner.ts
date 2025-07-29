import { statSync } from "node:fs"
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
        "websql",
        "filesystem",
        "indexdb",
        "localstorage",
        "shadercache",
        "websql",
        "serviceworkers",
        "cookies",
      ],
    })

    caller.toast.success("App data reset successfully")

    // reload the app
    win.reload()
  } catch (error: any) {
    caller.toast.error(`Error resetting app data: ${error.message}`)
  }
}

export const getCacheSize = async () => {
  const cachePath = path.join(app.getPath("userData"), "cache")

  // Size is in bytes
  const sizeInBytes = await getFolderSize(cachePath).catch((error) => {
    logger.error(error)
  })
  return sizeInBytes || 0
}

const getCachedFilesRecursive = async (dir: string, result: string[] = []) => {
  const files = await fsp.readdir(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = await fsp.stat(filePath)
    if (stat.isDirectory()) {
      const files = await getCachedFilesRecursive(filePath)
      result.push(...files)
    } else {
      result.push(filePath)
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
        const shouldCleanSize = cacheSize - limitByteSize - 1024 * 1024 * 50 // 50MB

        const cachePath = path.join(app.getPath("userData"), "cache")
        const files = await getCachedFilesRecursive(cachePath)
        // Sort by last modified
        files.sort((a, b) => {
          const aStat = statSync(a)
          const bStat = statSync(b)
          return bStat.mtime.getTime() - aStat.mtime.getTime()
        })

        let cleanedSize = 0
        for (const file of files) {
          try {
            const fileSize = statSync(file).size
            await fsp.rm(file, { force: true })
            cleanedSize += fileSize
            if (cleanedSize >= shouldCleanSize) {
              logger.info(`Cleaned ${cleanedSize} bytes cache`)
              break
            }
          } catch (error) {
            logger.error(`Failed to delete cache file ${file}:`, error)
          }
        }
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
