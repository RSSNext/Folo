import { rmSync } from "node:fs"

import { electronApp, optimizer } from "@electron-toolkit/utils"
import { callWindowExpose } from "@follow/shared/bridge"
import { DEV, LEGACY_APP_PROTOCOL } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { createBuildSafeHeaders } from "@follow/utils/headers"
import { IMAGE_PROXY_URL } from "@follow/utils/img-proxy"
import { parse } from "cookie-es"
import { app, BrowserWindow, inAppPurchase, net, protocol, session } from "electron"
import { join } from "pathe"

import { WindowManager } from "~/manager/window"

import { isMacOS } from "../env"
import { handleUrlRouting } from "../lib/router"
import { store } from "../lib/store"
import { updateNotificationsToken } from "../lib/user"
import { logger } from "../logger"
import { cleanupOldRender } from "../updater/hot-updater"
import { AppManager } from "./app"

const apiURL = process.env["VITE_API_URL"] || import.meta.env.VITE_API_URL
const buildSafeHeaders = createBuildSafeHeaders(env.VITE_WEB_URL, [
  env.VITE_OPENPANEL_API_URL || "",
  IMAGE_PROXY_URL,
  env.VITE_API_URL,
  "https://readwise.io",
])

export class BootstrapManager {
  public static start() {
    AppManager.init()

    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
      return
    }

    this.registerAppEvents()
  }

  private static registerAppEvents() {
    inAppPurchase.on("transactions-updated", (event, transactions) => {
      if (!Array.isArray(transactions)) {
        return
      }

      // Check each transaction.
      for (const transaction of transactions) {
        console.info("Transaction updated:", transaction)
        const { payment } = transaction

        switch (transaction.transactionState) {
          case "purchasing": {
            console.info(`Purchasing ${payment.productIdentifier}...`)
            break
          }

          case "purchased": {
            console.info(`${payment.productIdentifier} purchased.`)

            // Get the receipt url.
            const receiptURL = inAppPurchase.getReceiptURL()

            console.info(`Receipt URL: ${receiptURL}`)

            // Submit the receipt file to the server and check if it is valid.
            // @see https://developer.apple.com/library/content/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html
            // ...
            // If the receipt is valid, the product is purchased
            // ...

            // Finish the transaction.
            inAppPurchase.finishTransactionByDate(transaction.transactionDate)

            break
          }

          case "failed": {
            console.info(`Failed to purchase ${payment.productIdentifier}.`)

            // Finish the transaction.
            inAppPurchase.finishTransactionByDate(transaction.transactionDate)

            break
          }
          case "restored": {
            console.info(`The purchase of ${payment.productIdentifier} has been restored.`)

            break
          }
          case "deferred": {
            console.info(`The purchase of ${payment.productIdentifier} has been deferred.`)

            break
          }
          default: {
            break
          }
        }
      }
    })

    app.on("second-instance", (_, commandLine) => {
      const mainWindow = WindowManager.getMainWindow()
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
      }

      const url = commandLine.pop()
      if (url) {
        this.handleOpen(url)
      }
    })

    app.whenReady().then(async () => {
      protocol.handle("app", (request) => {
        try {
          const urlObj = new URL(request.url)
          return net.fetch(`file://${urlObj.pathname}`)
        } catch {
          logger.error("app protocol error", request.url)
          return new Response("Not found", { status: 404 })
        }
      })

      app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })

      electronApp.setAppUserModelId(`re.${LEGACY_APP_PROTOCOL}`)

      session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders = buildSafeHeaders({
          url: details.url,
          headers: details.requestHeaders,
        })

        callback({ cancel: false, requestHeaders: details.requestHeaders })
      })

      // Bypass CORS for PostHog analytics
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const url = new URL(details.url)

        if (url.hostname === "us.i.posthog.com") {
          const responseHeaders = details.responseHeaders || {}

          responseHeaders["access-control-allow-origin"] = ["*"]
          responseHeaders["access-control-allow-methods"] = [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
          ]
          responseHeaders["access-control-allow-headers"] = ["*"]
          responseHeaders["access-control-allow-credentials"] = ["true"]

          callback({
            cancel: false,
            responseHeaders,
          })
        } else {
          callback({ cancel: false })
        }
      })

      WindowManager.getMainWindowOrCreate()

      app.on("open-url", (_, url) => {
        const mainWindow = WindowManager.getMainWindowOrCreate()
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }
        url && this.handleOpen(url)
      })

      if (DEV) {
        this.installDevTools()
      }
    })

    app.on("before-quit", async () => {
      const window = WindowManager.getMainWindow()
      if (!window || window.isDestroyed()) return
      const bounds = window.getBounds()

      store.set(WindowManager.windowStateStoreKey, {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      })
      await session.defaultSession.cookies.flushStore()
      await cleanupOldRender()
    })

    app.on("window-all-closed", () => {
      if (!isMacOS) {
        app.quit()
      }
    })

    app.on("before-quit", () => {
      const windows = BrowserWindow.getAllWindows()
      windows.forEach((window) => window.destroy())

      if (import.meta.env.DEV) {
        const cacheDir = join(app.getPath("userData"), "Cache")
        const codeCacheDir = join(app.getPath("userData"), "Code Cache")

        rmSync(cacheDir, { recursive: true, force: true })
        rmSync(codeCacheDir, { recursive: true, force: true })
      }
    })
  }

  private static installDevTools() {
    import("electron-devtools-installer").then(
      ({ default: installExtension, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS }) => {
        ;[
          REDUX_DEVTOOLS,
          REACT_DEVELOPER_TOOLS,
          { id: "acndjpgkpaclldomagafnognkcgjignd" },
        ].forEach((extension) => {
          installExtension(extension, {
            loadExtensionOptions: { allowFileAccess: true },
          })
            .then((extension) => console.info(`Added Extension:  ${extension.name}`))
            .catch((err) => console.info("An error occurred:", err))
        })

        session.defaultSession.getAllExtensions().forEach((e) => {
          session.defaultSession.loadExtension(e.path)
        })
      },
    )
  }

  private static async handleOpen(url: string) {
    const mainWindow = WindowManager.getMainWindow()
    if (!mainWindow) return

    const isValid = URL.canParse(url)
    if (!isValid) return
    const urlObj = new URL(url)

    if (urlObj.hostname === "auth" || urlObj.pathname === "//auth") {
      const token = urlObj.searchParams.get("token")

      if (token) {
        await callWindowExpose(mainWindow).applyOneTimeToken(token)
      } else {
        const ck = urlObj.searchParams.get("ck")
        const userId = urlObj.searchParams.get("userId")

        if (ck && apiURL) {
          const cookie = parse(atob(ck), { decode: (value) => value })
          Object.keys(cookie).forEach(async (name) => {
            const value = cookie[name]!
            await mainWindow.webContents.session.cookies.set({
              url: apiURL,
              name,
              value,
              secure: true,
              httpOnly: true,
              domain: new URL(apiURL).hostname,
              sameSite: "no_restriction",
              expirationDate: new Date().setDate(new Date().getDate() + 30),
            })
          })

          if (userId) {
            await callWindowExpose(mainWindow).clearIfLoginOtherAccount(userId)
          }
          mainWindow.reload()

          updateNotificationsToken()
        }
      }
    } else {
      handleUrlRouting(url)
    }
  }
}
