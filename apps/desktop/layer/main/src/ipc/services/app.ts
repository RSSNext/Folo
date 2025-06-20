import path from "node:path"
import { fileURLToPath } from "node:url"

import { callWindowExpose } from "@follow/shared/bridge"
import { DEV } from "@follow/shared/constants"
import { app, BrowserWindow, clipboard, dialog } from "electron"

import { i18n } from "~/lib/i18n"
import { registerAppTray } from "~/lib/tray"
import { logger } from "~/logger"
import { AppManager } from "~/manager/app"
import { WindowManager } from "~/manager/window"
import { cleanupOldRender, loadDynamicRenderEntry } from "~/updater/hot-updater"

import { downloadFile } from "../../lib/download"
import { checkForAppUpdates, quitAndInstall } from "../../updater"
import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

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

  @IpcMethod()
  getAppVersion(): string {
    return app.getVersion()
  }

  @IpcMethod()
  checkForUpdates(): void {
    checkForAppUpdates()
  }

  @IpcMethod()
  switchAppLocale(context: IpcContext, input: string): void {
    i18n.changeLanguage(input)
    AppManager.registerMenuAndContextMenu()
    registerAppTray()

    app.commandLine.appendSwitch("lang", input)
  }

  @IpcMethod()
  rendererUpdateReload(): void {
    const __dirname = fileURLToPath(new URL(".", import.meta.url))
    const allWindows = BrowserWindow.getAllWindows()
    const dynamicRenderEntry = loadDynamicRenderEntry()

    const appLoadEntry = dynamicRenderEntry || path.resolve(__dirname, "../renderer/index.html")
    logger.info("appLoadEntry", appLoadEntry)
    const mainWindow = WindowManager.getMainWindow()

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
  }

  @IpcMethod()
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

  @IpcMethod()
  quitAndInstall(_context: IpcContext): void {
    quitAndInstall()
  }

  @IpcMethod()
  readClipboard(_context: IpcContext): string {
    return clipboard.readText()
  }

  @IpcMethod()
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

  @IpcMethod()
  clearSearch(context: IpcContext): void {
    context.sender.stopFindInPage("keepSelection")
  }

  @IpcMethod()
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

  @IpcMethod()
  getAppPath(_context: IpcContext): string {
    return app.getAppPath()
  }

  @IpcMethod()
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
