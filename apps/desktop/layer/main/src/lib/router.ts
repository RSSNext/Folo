import { callWindowExpose } from "@follow/shared/bridge"
import { extractElectronWindowOptions } from "@follow/shared/electron"
import type { BrowserWindow } from "electron/main"

import { logger } from "~/logger"
import { WindowManager } from "~/manager/window"

export const handleUrlRouting = (url: string) => {
  const options = extractElectronWindowOptions(url)

  // For example, the url is "follow://add?id=123&type=list&url=https://example.com"
  const doubleSlash = url.indexOf("://")
  if (doubleSlash === -1) {
    logger.error("url routing error: no protocol found", url)
    return
  }
  // Remove the protocol
  // For example, the uri is "/add?id=123&type=list&url=https://example.com"
  const uri = url.slice(doubleSlash + 2)
  try {
    const { pathname, searchParams } = new URL(uri, "https://follow.dev")

    const pathnameTrimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname

    switch (pathnameTrimmed) {
      case "/add": {
        callMainWindow(url, (mainWindow) => {
          const caller = callWindowExpose(mainWindow)

          const id = searchParams.get("id") ?? undefined
          const isList = searchParams.get("type") === "list"
          const urlParam = searchParams.get("url") ?? undefined
          if (!id && !urlParam) return
          caller.follow({ isList, id, url: urlParam })
        })
        return
      }
      case "/discover": {
        callMainWindow(url, (mainWindow) => {
          const caller = callWindowExpose(mainWindow)

          const route = searchParams.get("route") ?? undefined

          if (!route) return
          caller.rsshubRoute(route)
        })
        return
      }
      case "/feed": {
        callMainWindow(url, (mainWindow) => {
          const caller = callWindowExpose(mainWindow)

          const id = searchParams.get("id") ?? undefined
          const view = searchParams.get("view") ?? "0"
          if (!id) return
          caller.goToFeed({
            id,
            view: Number.parseInt(view, 10),
          })
        })
        return
      }
      case "/list": {
        callMainWindow(url, (mainWindow) => {
          const caller = callWindowExpose(mainWindow)

          const id = searchParams.get("id") ?? undefined
          const view = searchParams.get("view") ?? "0"
          if (!id) return
          caller.goToList({
            id,
            view: Number.parseInt(view, 10),
          })
        })
        return
      }
      case "/refresh": {
        callMainWindow(url, (mainWindow) => {
          const caller = callWindowExpose(mainWindow)
          caller.refreshSession()
        })
        return
      }
      case "/": {
        callMainWindow(url, (mainWindow) => {
          mainWindow.restore()
          mainWindow.focus()
        })
        return
      }

      default: {
        const { height, resizable = true, width } = options || {}
        WindowManager.createWindow({
          extraPath: `#${uri}`,
          width: width ?? 800,
          height: height ?? 700,
          minWidth: 600,
          minHeight: 600,
          resizable,
        })
        return
      }
    }
  } catch (err) {
    logger.error("routing error:", err)
  }
}

const callMainWindow = (url: string, fn: (mainWindow: BrowserWindow) => any) => {
  const mainWindow = WindowManager.getMainWindow()
  if (!mainWindow) {
    WindowManager.createMainWindow()

    return handleUrlRouting(url)
  }
  mainWindow.restore()
  mainWindow.focus()
  fn(mainWindow)
}
