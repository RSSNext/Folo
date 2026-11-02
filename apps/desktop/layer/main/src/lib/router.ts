import { callWindowExpose } from "@follow/shared/bridge"
import type { BrowserWindow } from "electron/main"

import { openDeepLink } from "~/lib/deep-link"
import { logger } from "~/logger"
import { WindowManager } from "~/manager/window"

export const handleUrlRouting = (url: string) => {
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
        // A link of a newer client, or a made-up one. It only brings the app to the front: a
        // window of its own would load the whole app at a route it doesn't have.
        logger.warn("Ignored a deep link with an unknown path", { pathname: pathnameTrimmed })
        callMainWindow(url, () => {})
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

    // Routed again once the new window can take it
    return openDeepLink(url)
  }
  mainWindow.restore()
  mainWindow.focus()
  fn(mainWindow)
}
