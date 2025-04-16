import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { getRendererHandlers } from "@egoist/tipc/main"
import { callWindowExpose } from "@follow/shared/bridge"
import { DEV } from "@follow/shared/constants"
import { app, BrowserWindow, clipboard, dialog, shell } from "electron"

import { filePathToAppUrl } from "~/helper"
import { registerMenuAndContextMenu } from "~/init"
import { clearAllData, getCacheSize } from "~/lib/cleaner"
import { store, StoreKey } from "~/lib/store"
import { registerAppTray } from "~/lib/tray"
import { logger, revealLogFile } from "~/logger"
import { cleanupOldRender, loadDynamicRenderEntry } from "~/updater/hot-updater"

import { downloadFile } from "../lib/download"
import { i18n } from "../lib/i18n"
import type { RendererHandlers } from "../renderer-handlers"
import { quitAndInstall } from "../updater"
import { getMainWindow } from "../window"
import { t } from "./_instance"

export const appRoute = {
  saveToEagle: t.procedure
    .input<{ url: string; mediaUrls: string[] }>()
    .action(async ({ input }) => {
      try {
        const res = await fetch("http://localhost:41595/api/item/addFromURLs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: input.mediaUrls?.map((media) => ({
              url: media,
              website: input.url,
              headers: {
                referer: input.url,
              },
            })),
          }),
        })
        return await res.json()
      } catch {
        return null
      }
    }),

  invalidateQuery: t.procedure
    .input<(string | number | undefined)[]>()
    .action(async ({ input }) => {
      const mainWindow = getMainWindow()
      if (!mainWindow) return
      const handlers = getRendererHandlers<RendererHandlers>(mainWindow.webContents)
      handlers.invalidateQuery.send(input)
    }),

  windowAction: t.procedure
    .input<{ action: "close" | "minimize" | "maximum" }>()
    .action(async ({ input, context }) => {
      if (context.sender.getType() === "window") {
        const window: BrowserWindow | null = (context.sender as Sender).getOwnerBrowserWindow()

        if (!window) return
        switch (input.action) {
          case "close": {
            window.close()
            break
          }
          case "minimize": {
            window.minimize()
            break
          }

          case "maximum": {
            // FIXME: this is a electron bug, see https://github.com/RSSNext/Follow/issues/231
            // So in this way we use a workaround to fix it, that is manually resize the window
            // Comemnt the manually handle logic and disable backgroundMaterial for now
            // if (isWindows11) {
            //   const display = screen.getDisplayMatching(window.getBounds())
            //   const size = display.workAreaSize

            //   const isMaximized = size.height === window.getSize()[1]

            //   const storeKey = Symbol.for("maximized")
            //   if (isMaximized) {
            //     const stored = window[storeKey]
            //     if (!stored) return

            //     window.setResizable(true)
            //     window.setMovable(true)

            //     window.setBounds(
            //       {
            //         width: stored.size[0],
            //         height: stored.size[1],
            //         x: stored.position[0],
            //         y: stored.position[1],
            //       },
            //       true,
            //     )

            //     delete window[storeKey]
            //   } else {
            //     const currentWindowSize = window.getSize()
            //     const currentWindowPosition = window.getPosition()
            //     window[storeKey] = {
            //       size: currentWindowSize,
            //       position: currentWindowPosition,
            //     }

            //     // Maually Resize
            //     const { workArea } = display

            //     window.setBounds(
            //       {
            //         x: workArea.x,
            //         y: workArea.y,
            //         width: workArea.width,
            //         height: workArea.height,
            //       },
            //       true,
            //     )

            //     window.setResizable(false)
            //     window.setMovable(false)
            //   }

            //   return
            // }

            if (window.isMaximized()) {
              window.unmaximize()
            } else {
              window.maximize()
            }

            break
          }
        }
      }
    }),

  quitAndInstall: t.procedure.action(async () => {
    quitAndInstall()
  }),

  /// clipboard

  readClipboard: t.procedure.action(async () => clipboard.readText()),
  /// search
  search: t.procedure
    .input<{
      text: string
      options: Electron.FindInPageOptions
    }>()
    .action(async ({ input, context }) => {
      const { sender: webContents } = context

      const { promise, resolve } = Promise.withResolvers<Electron.Result | null>()

      let requestId = -1
      webContents.once("found-in-page", (_, result) => {
        resolve(result.requestId === requestId ? result : null)
      })
      requestId = webContents.findInPage(input.text, input.options)
      return promise
    }),
  clearSearch: t.procedure.action(async ({ context: { sender: webContents } }) => {
    webContents.stopFindInPage("keepSelection")
  }),

  download: t.procedure.input<string>().action(async ({ input, context: { sender } }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: input.split("/").pop(),
    })
    if (result.canceled) return

    // return result.filePath;
    await downloadFile(input, result.filePath).catch((err) => {
      const senderWindow = (sender as Sender).getOwnerBrowserWindow()
      if (!senderWindow) return
      callWindowExpose(senderWindow).toast.error("Download failed!", {
        duration: 1000,
      })
      throw err
    })

    const senderWindow = (sender as Sender).getOwnerBrowserWindow()
    if (!senderWindow) return
    callWindowExpose(senderWindow).toast.success("Download success!", {
      duration: 1000,
    })
  }),

  getAppPath: t.procedure.action(async () => app.getAppPath()),
  resolveAppAsarPath: t.procedure.input<string>().action(async ({ input }) => {
    return filePathToAppUrl(path.resolve(app.getAppPath(), input))
  }),

  switchAppLocale: t.procedure.input<string>().action(async ({ input }) => {
    i18n.changeLanguage(input)
    registerMenuAndContextMenu()
    registerAppTray()

    app.commandLine.appendSwitch("lang", input)
  }),

  clearAllData: t.procedure.action(clearAllData),

  saveToObsidian: t.procedure
    .input<{
      url: string
      title: string
      content: string
      author: string
      publishedAt: string
      vaultPath: string
    }>()
    .action(async ({ input }) => {
      try {
        const { url, title, content, author, publishedAt, vaultPath } = input

        const fileName = `${(title || publishedAt).trim().slice(0, 20).replaceAll("/", "-")}.md`
        const filePath = path.join(vaultPath, fileName)
        const exists = fs.existsSync(filePath)
        if (exists) {
          return { success: false, error: "File already exists" }
        }

        const markdown = `---
url: ${url}
author: ${author}
publishedAt: ${publishedAt}
---

# ${title}

${content}
`

        await fsp.writeFile(filePath, markdown, "utf-8")
        return { success: true }
      } catch (error) {
        console.error("Failed to save to Obsidian:", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
      }
    }),

  getAppVersion: t.procedure.action(async () => {
    return app.getVersion()
  }),
  rendererUpdateReload: t.procedure.action(async () => {
    const __dirname = fileURLToPath(new URL(".", import.meta.url))
    const allWindows = BrowserWindow.getAllWindows()
    const dynamicRenderEntry = loadDynamicRenderEntry()

    const appLoadEntry =
      dynamicRenderEntry || path.resolve(__dirname, "../../../../../renderer/index.html")
    logger.info("appLoadEntry", appLoadEntry)
    const mainWindow = getMainWindow()

    for (const window of allWindows) {
      if (window === mainWindow) {
        if (DEV) {
          logger.verbose("[rendererUpdateReload]: skip reload in dev")
          break
        }
        window.loadFile(appLoadEntry)
      } else window.destroy()
    }

    setTimeout(() => {
      cleanupOldRender()
    }, 1000)
  }),

  getCacheSize: t.procedure.action(async () => {
    return getCacheSize()
  }),
  openCacheFolder: t.procedure.action(async () => {
    const dir = path.join(app.getPath("userData"), "cache")
    shell.openPath(dir)
  }),
  getCacheLimit: t.procedure.action(async () => {
    return store.get(StoreKey.CacheSizeLimit)
  }),

  clearCache: t.procedure.action(async () => {
    const cachePath = path.join(app.getPath("userData"), "cache", "Cache_Data")
    if (process.platform === "win32") {
      // Request elevation on Windows

      try {
        // Create a bat file to delete cache with elevated privileges
        const batPath = path.join(app.getPath("temp"), "clear_cache.bat")
        await fsp.writeFile(batPath, `@echo off\nrd /s /q "${cachePath}"\ndel "%~f0"`, "utf-8")

        // Execute the bat file with admin privileges
        await shell.openPath(batPath)
        return
      } catch (err) {
        logger.error("Failed to clear cache with elevation", { error: err })
      }
    }
    await fsp.rm(cachePath, { recursive: true, force: true }).catch(() => {
      logger.error("Failed to clear cache")
    })
  }),

  limitCacheSize: t.procedure.input<number>().action(async ({ input }) => {
    logger.info("set limitCacheSize", input)
    if (input === 0) {
      store.delete(StoreKey.CacheSizeLimit)
    } else {
      store.set(StoreKey.CacheSizeLimit, input)
    }
  }),

  revealLogFile: t.procedure.action(async () => {
    return revealLogFile()
  }),
}

interface Sender extends Electron.WebContents {
  getOwnerBrowserWindow: () => Electron.BrowserWindow | null
}
