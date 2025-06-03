import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { callWindowExpose } from "@follow/shared/bridge"
import { DEV } from "@follow/shared/constants"
import type { BrowserWindow } from "electron"
import { app, clipboard, dialog, shell } from "electron"

import { filePathToAppUrl } from "../../helper"
import { registerMenuAndContextMenu } from "../../init"
import { clearAllData, getCacheSize } from "../../lib/cleaner"
import { downloadFile } from "../../lib/download"
import { i18n } from "../../lib/i18n"
import { store, StoreKey } from "../../lib/store"
import { registerAppTray } from "../../lib/tray"
import { logger, revealLogFile } from "../../logger"
import { checkForAppUpdates, quitAndInstall } from "../../updater"
import { cleanupOldRender, loadDynamicRenderEntry } from "../../updater/hot-updater"
import { getMainWindow } from "../../window"
import type { IpcContext } from "../base"
import { IpcService } from "../base"

// Input types
interface SaveToEagleInput {
  url: string
  mediaUrls: string[]
}

interface WindowActionInput {
  action: "close" | "minimize" | "maximum"
}

interface SearchInput {
  text: string
  options: Electron.FindInPageOptions
}

interface Sender extends Electron.WebContents {
  getOwnerBrowserWindow: () => Electron.BrowserWindow | null
}

export class AppService extends IpcService {
  constructor() {
    super("app")
  }

  protected registerMethods(): void {
    this.registerMethod("saveToEagle", this.saveToEagle.bind(this))
    this.registerMethod("invalidateQuery", this.invalidateQuery.bind(this))
    this.registerMethod("windowAction", this.windowAction.bind(this))
    this.registerMethod("quitAndInstall", this.quitAndInstall.bind(this))
    this.registerMethod("readClipboard", this.readClipboard.bind(this))
    this.registerMethod("search", this.search.bind(this))
    this.registerMethod("clearSearch", this.clearSearch.bind(this))
    this.registerMethod("download", this.download.bind(this))
    this.registerMethod("getAppPath", this.getAppPath.bind(this))
    this.registerMethod("resolveAppAsarPath", this.resolveAppAsarPath.bind(this))
  }

  async saveToEagle(context: IpcContext, input: SaveToEagleInput): Promise<any> {
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
  }

  invalidateQuery(context: IpcContext, input: (string | number | undefined)[]): void {
    const mainWindow = getMainWindow()
    if (!mainWindow) return
    this.sendToRenderer(mainWindow.webContents, "invalidateQuery", input)
  }

  windowAction(context: IpcContext, input: WindowActionInput): void {
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
          if (window.isMaximized()) {
            window.unmaximize()
          } else {
            window.maximize()
          }
          break
        }
      }
    }
  }

  quitAndInstall(_context: IpcContext): void {
    quitAndInstall()
  }

  readClipboard(_context: IpcContext): string {
    return clipboard.readText()
  }

  async search(context: IpcContext, input: SearchInput): Promise<Electron.Result | null> {
    const { sender: webContents } = context

    const { promise, resolve } = Promise.withResolvers<Electron.Result | null>()

    let requestId = -1
    webContents.once("found-in-page", (_, result) => {
      resolve(result.requestId === requestId ? result : null)
    })
    requestId = webContents.findInPage(input.text, input.options)
    return promise
  }

  clearSearch(context: IpcContext): void {
    context.sender.stopFindInPage("keepSelection")
  }

  async download(context: IpcContext, input: string): Promise<void> {
    const result = await dialog.showSaveDialog({
      defaultPath: input.split("/").pop(),
    })
    if (result.canceled) return

    try {
      await downloadFile(input, result.filePath)

      const senderWindow = (context.sender as Sender).getOwnerBrowserWindow()
      if (senderWindow) {
        callWindowExpose(senderWindow).toast.success("Download success!", {
          duration: 1000,
        })
      }
    } catch (err) {
      const senderWindow = (context.sender as Sender).getOwnerBrowserWindow()
      if (senderWindow) {
        callWindowExpose(senderWindow).toast.error("Download failed!", {
          duration: 1000,
        })
      }
      throw err
    }
  }

  getAppPath(_context: IpcContext): string {
    return app.getAppPath()
  }

  resolveAppAsarPath(context: IpcContext, input: string): string {
    if (input.startsWith("file://")) {
      input = fileURLToPath(input)
    }

    if (path.isAbsolute(input)) {
      return input
    }

    return path.join(app.getAppPath(), input)
  }
}
