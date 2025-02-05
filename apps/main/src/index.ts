import { electronApp, optimizer } from "@electron-toolkit/utils"
import { callWindowExpose } from "@follow/shared/bridge"
import { APP_PROTOCOL } from "@follow/shared/constants"
import { env } from "@follow/shared/env"
import { imageRefererMatches, selfRefererMatches } from "@follow/shared/image"
import { parse } from "cookie-es"
import { app, BrowserWindow, session } from "electron"
import squirrelStartup from "electron-squirrel-startup"

import { DEVICE_ID } from "./constants/system"
import { isDev, isMacOS } from "./env"
import { initializeAppStage0, initializeAppStage1 } from "./init"
import { updateProxy } from "./lib/proxy"
import { handleUrlRouting } from "./lib/router"
import { store } from "./lib/store"
import { registerAppTray } from "./lib/tray"
import { setBetterAuthSessionCookie, updateNotificationsToken } from "./lib/user"
import { registerUpdater } from "./updater"
import { cleanupOldRender } from "./updater/hot-updater"
import {
  createMainWindow,
  getMainWindow,
  getMainWindowOrCreate,
  windowStateStoreKey,
} from "./window"

if (isDev) console.info("[main] env loaded:", env)

const apiURL = process.env["VITE_API_URL"] || import.meta.env.VITE_API_URL

console.info("[main] device id:", DEVICE_ID)
if (squirrelStartup) {
  app.quit()
}

function bootstrap() {
  initializeAppStage0()
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()

    return
  }

  let mainWindow: BrowserWindow

  initializeAppStage1()

  app.on("second-instance", (_, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
    }

    const url = commandLine.pop()
    if (url) {
      handleOpen(url)
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Set app user model id for windows
    electronApp.setAppUserModelId(`re.${APP_PROTOCOL}`)

    mainWindow = createMainWindow()

    // restore cookies
    const cookies = store.get("cookies")
    if (cookies) {
      Promise.all(
        cookies.map((cookie) => {
          const setCookieDetails: Electron.CookiesSetDetails = {
            url: apiURL,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate,
            sameSite: cookie.sameSite as "unspecified" | "no_restriction" | "lax" | "strict",
          }

          return mainWindow.webContents.session.cookies.set(setCookieDetails)
        }),
      )
    }

    updateProxy()
    registerUpdater()
    registerAppTray()

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      // remove Electron, Follow from user agent
      let userAgent = details.requestHeaders["User-Agent"]
      if (userAgent) {
        userAgent = userAgent.replace(/\s?Electron\/[\d.]+/, "")
        userAgent = userAgent.replace(/\s?Follow\/[\d.a-zA-Z-]+/, "")
      }
      details.requestHeaders["User-Agent"] = userAgent!

      // set referer and origin
      if (selfRefererMatches.some((item) => details.url.startsWith(item))) {
        details.requestHeaders["Referer"] = "https://app.follow.is"
        details.requestHeaders["Origin"] = "https://app.follow.is"
      } else {
        const refererMatch = imageRefererMatches.find((item) => item.url.test(details.url))
        const referer = refererMatch?.referer
        if (referer) {
          details.requestHeaders["Referer"] = referer
        }
      }

      callback({ cancel: false, requestHeaders: details.requestHeaders })
    })

    // handle session cookie when sign in with email in electron
    session.defaultSession.webRequest.onHeadersReceived(
      {
        urls: [
          `${apiURL}/better-auth/sign-in/email?*`,
          `${apiURL}/better-auth/two-factor/verify-totp?*`,
        ],
      },
      (detail, callback) => {
        const { responseHeaders } = detail
        if (responseHeaders?.["set-cookie"]) {
          const cookies = responseHeaders["set-cookie"] as string[]
          cookies.forEach((cookie) => {
            const cookieObj = parse(cookie)
            Object.keys(cookieObj).forEach((name) => {
              const value = cookieObj[name]
              mainWindow.webContents.session.cookies.set({
                url: apiURL,
                name,
                value,
                secure: true,
                httpOnly: true,
                domain: new URL(apiURL).hostname,
                sameSite: "no_restriction",
              })
            })
          })
        }

        callback({ cancel: false, responseHeaders })
      },
    )

    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      mainWindow = getMainWindowOrCreate()
      mainWindow.show()
    })

    app.on("open-url", (_, url) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      } else {
        mainWindow = createMainWindow()
      }
      url && handleOpen(url)
    })

    // for dev debug

    if (process.env.NODE_ENV === "development") {
      import("electron-devtools-installer").then(
        ({ default: installExtension, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS }) => {
          ;[REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS].forEach((extension) => {
            installExtension(extension, {
              loadExtensionOptions: { allowFileAccess: true },
            })
              .then((name) => console.info(`Added Extension:  ${name}`))
              .catch((err) => console.info("An error occurred:", err))
          })

          session.defaultSession.getAllExtensions().forEach((e) => {
            session.defaultSession.loadExtension(e.path)
          })
        },
      )
    }
  })

  app.on("before-quit", async () => {
    // store window pos when before app quit
    const window = getMainWindow()
    if (!window || window.isDestroyed()) return
    const bounds = window.getBounds()

    store.set(windowStateStoreKey, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    })
    await session.defaultSession.cookies.flushStore()

    const cookies = await session.defaultSession.cookies.get({})
    store.set("cookies", cookies)

    await cleanupOldRender()
  })

  const handleOpen = async (url: string) => {
    const isValid = URL.canParse(url)
    if (!isValid) return
    const urlObj = new URL(url)

    if (urlObj.hostname === "auth" || urlObj.pathname === "//auth") {
      const ck = urlObj.searchParams.get("ck")
      const userId = urlObj.searchParams.get("userId")

      if (ck && apiURL) {
        setBetterAuthSessionCookie(ck)
        const cookie = parse(atob(ck))
        Object.keys(cookie).forEach((name) => {
          const value = cookie[name]
          mainWindow.webContents.session.cookies.set({
            url: apiURL,
            name,
            value,
            secure: true,
            httpOnly: true,
            domain: new URL(apiURL).hostname,
            sameSite: "no_restriction",
          })
        })

        userId && (await callWindowExpose(mainWindow).clearIfLoginOtherAccount(userId))
        mainWindow.reload()

        updateNotificationsToken()
      }
    } else {
      handleUrlRouting(url)
    }
  }

  // Quit when all windows are closed, except on  macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (!isMacOS) {
      app.quit()
    }
  })

  app.on("before-quit", () => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((window) => window.destroy())
  })
}

bootstrap()
