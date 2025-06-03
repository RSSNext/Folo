import path from "node:path"
import { fileURLToPath } from "node:url"

import { is } from "@electron-toolkit/utils"
import { LEGACY_APP_PROTOCOL } from "@follow/shared"
import { callWindowExpose, WindowState } from "@follow/shared/bridge"
import { APP_PROTOCOL, DEV } from "@follow/shared/constants"
import type { BrowserWindowConstructorOptions } from "electron"
import { app, BrowserWindow, screen, shell } from "electron"
import type { Event } from "electron/main"

import { START_IN_TRAY_ARGS } from "./constants/app"
import { isMacOS, isWindows, isWindows11 } from "./env"
import { filePathToAppUrl, getIconPath } from "./helper"
import { services } from "./ipc"
import { t } from "./lib/i18n"
import { store } from "./lib/store"
import { getTrayConfig } from "./lib/tray"
import { refreshBound } from "./lib/utils"
import { logger } from "./logger"
import { loadDynamicRenderEntry } from "./updater/hot-updater"

const windows = {
  mainWindow: null as BrowserWindow | null,
}
globalThis["windows"] = windows
const { platform } = process
const __dirname = fileURLToPath(new URL(".", import.meta.url))
export function createWindow(
  options: {
    extraPath?: string
    height: number
    width: number
  } & BrowserWindowConstructorOptions,
) {
  const { extraPath, height, width, ...configs } = options

  const baseWindowConfig: Electron.BrowserWindowConstructorOptions = {
    width,
    height,
    show: false,
    resizable: configs?.resizable ?? true,
    autoHideMenuBar: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      webviewTag: true,
      webSecurity: !DEV,
      nodeIntegration: true,
      contextIsolation: false,
    },
  }

  switch (platform) {
    case "darwin": {
      Object.assign(baseWindowConfig, {
        titleBarStyle: "hiddenInset",
        trafficLightPosition: {
          x: 18,
          y: 18,
        },
        vibrancy: "sidebar",
        visualEffectState: "followWindow",
        transparent: true,
      } as Electron.BrowserWindowConstructorOptions)
      break
    }

    case "win32": {
      Object.assign(baseWindowConfig, {
        icon: getIconPath(),

        titleBarStyle: "hidden",
        // Electron material bug, comment this for now
        // backgroundMaterial: isWindows11 ? "mica" : undefined,

        frame: true,
      } as Electron.BrowserWindowConstructorOptions)
      break
    }

    default: {
      baseWindowConfig.icon = getIconPath()
    }
  }

  // Create the browser window.
  const window = new BrowserWindow({
    ...baseWindowConfig,
    ...configs,
  })

  window.on("leave-html-full-screen", () => {
    // To solve the vibrancy losing issue when leaving full screen mode
    // @see https://github.com/toeverything/AFFiNE/blob/280e24934a27557529479a70ab38c4f5fc65cb00/packages/frontend/electron/src/main/windows-manager/main-window.ts:L157
    refreshBound(window)
    refreshBound(window, 1000)
  })

  window.on("ready-to-show", () => {
    const shouldShowWindow =
      !app.getLoginItemSettings().wasOpenedAsHidden && !process.argv.includes(START_IN_TRAY_ARGS)
    if (shouldShowWindow) window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  const handleExternalProtocol = async (e: Event, url: string, window: BrowserWindow) => {
    const { protocol } = new URL(url)

    const ignoreProtocols = [
      "http",
      "https",
      LEGACY_APP_PROTOCOL,
      APP_PROTOCOL,
      "file",
      "code",
      "cursor",
      "app",
    ]
    if (ignoreProtocols.includes(protocol.slice(0, -1))) {
      return
    }
    e.preventDefault()

    const caller = callWindowExpose(window)
    const confirm = await caller.dialog.ask({
      title: t("dialog.openExternalApp.title"),
      message: t("dialog.openExternalApp.message", { url, interpolation: { escapeValue: false } }),
      confirmText: t("dialog.open"),
      cancelText: t("dialog.cancel"),
    })
    if (!confirm) {
      return
    }
    shell.openExternal(url)
  }

  // Handle main window external links
  window.webContents.on("will-navigate", (e, url) => handleExternalProtocol(e, url, window))

  // Handle webview external links
  window.webContents.on("did-attach-webview", (_, webContents) => {
    webContents.on("will-navigate", (e, url) => handleExternalProtocol(e, url, window))
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(process.env["ELECTRON_RENDERER_URL"] + (options?.extraPath || ""))

    logger.log(process.env["ELECTRON_RENDERER_URL"] + (options?.extraPath || ""))
  } else {
    // Production entry
    const dynamicRenderEntry = loadDynamicRenderEntry()
    logger.info("load dynamic render entry", dynamicRenderEntry)
    const appLoadFileEntry = dynamicRenderEntry || path.resolve(__dirname, "../renderer/index.html")

    const appLoadEntry = `${filePathToAppUrl(appLoadFileEntry)}${options?.extraPath || ""}`

    window.loadURL(appLoadEntry)
    logger.log("load URL", appLoadEntry)
  }

  if (isWindows) {
    // Change the default font-family and font-size of the devtools.
    // Make it consistent with Chrome on Windows, instead of SimSun.
    // ref: [[Feature Request]: Add possibility to change DevTools font · Issue #42055 · electron/electron](https://github.com/electron/electron/issues/42055)
    window.webContents.on("devtools-opened", () => {
      // source-code-font: For code such as Elements panel
      // monospace-font: For sidebar such as Event Listener Panel
      const css = `:root {--devtool-font-family: consolas, operator mono, Cascadia Code, OperatorMonoSSmLig Nerd Font,"Agave Nerd Font","Cascadia Code PL", monospace;--source-code-font-family:var(--devtool-font-family);--source-code-font-size: 13px;--monospace-font-family: var(--devtool-font-family);--monospace-font-size: 13px;}`
      window.webContents.devToolsWebContents?.executeJavaScript(`
        const overriddenStyle = document.createElement('style');
        overriddenStyle.innerHTML = '${css.replaceAll("\n", " ")}';
        document.body.append(overriddenStyle);
        document.querySelectorAll('.platform-windows').forEach(el => el.classList.remove('platform-windows'));
        addStyleToAutoComplete();
        const observer = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const item = mutation.addedNodes[i];
                        if (item.classList.contains('editor-tooltip-host')) {
                            addStyleToAutoComplete();
                        }
                    }
                }
            }
        });
        observer.observe(document.body, {childList: true});
        function addStyleToAutoComplete() {
            document.querySelectorAll('.editor-tooltip-host').forEach(element => {
                if (element.shadowRoot.querySelectorAll('[data-key="overridden-dev-tools-font"]').length === 0) {
                    const overriddenStyle = document.createElement('style');
                    overriddenStyle.setAttribute('data-key', 'overridden-dev-tools-font');
                    overriddenStyle.innerHTML = '.cm-tooltip-autocomplete ul[role=listbox] {font-family: consolas !important;}';
                    element.shadowRoot.append(overriddenStyle);
                }
            });
        }
    `)
    })
  }

  // async render and main state
  window.on("maximize", async () => {
    const caller = callWindowExpose(window)
    await caller.setWindowState(WindowState.MAXIMIZED)
  })

  window.on("unmaximize", async () => {
    const caller = callWindowExpose(window)
    await caller.setWindowState(WindowState.NORMAL)
  })

  window.on("minimize", async () => {
    const caller = callWindowExpose(window)
    await caller.setWindowState(WindowState.MINIMIZED)
  })

  window.on("restore", async () => {
    const caller = callWindowExpose(window)
    await caller.setWindowState(WindowState.NORMAL)
  })

  return window
}
export const windowStateStoreKey = "windowState"
export const createMainWindow = () => {
  const windowState = store.get(windowStateStoreKey)
  const primaryDisplay = screen.getPrimaryDisplay()
  const { workArea } = primaryDisplay

  const maxWidth = workArea.width
  const maxHeight = workArea.height

  const width = Math.min(windowState?.width || 1200, maxWidth)
  const height = Math.min(windowState?.height || 900, maxHeight)

  const ensureInBounds = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(value, max))
  }

  const x =
    windowState?.x !== undefined
      ? ensureInBounds(windowState.x, workArea.x, workArea.x + workArea.width - width)
      : undefined

  const y =
    windowState?.y !== undefined
      ? ensureInBounds(windowState.y, workArea.y, workArea.y + workArea.height - height)
      : undefined

  const window = createWindow({
    width: windowState?.width || 1200,
    height: windowState?.height || 900,
    x,
    y,
    minWidth: Math.min(1024, maxWidth),
    minHeight: Math.min(500, maxHeight),
  })

  window.on("close", () => {
    if (isWindows11) {
      const windowStoreKey = Symbol.for("maximized")
      if (window[windowStoreKey]) {
        const stored = window[windowStoreKey]
        store.set(windowStateStoreKey, {
          width: stored.size[0],
          height: stored.size[1],
          x: stored.position[0],
          y: stored.position[1],
        })

        return
      }
    }

    const bounds = window.getBounds()
    store.set(windowStateStoreKey, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    })
  })

  windows.mainWindow = window

  window.on("close", (event) => {
    const minimizeToTray = getTrayConfig()
    if (isMacOS || minimizeToTray) {
      event.preventDefault()
      if (window.isFullScreen()) {
        window.once("leave-full-screen", () => {
          window.hide()
        })
        window.setFullScreen(false)
      } else {
        window.hide()
      }

      const caller = callWindowExpose(window)
      caller.onWindowClose()
    } else {
      windows.mainWindow = null
    }
  })

  window.on("show", () => {
    services.dock.pollingUpdateUnreadCount()

    const caller = callWindowExpose(window)

    caller.onWindowShow()
  })

  window.on("hide", async () => {
    const caller = callWindowExpose(window)
    const settings = await caller.getUISettings()

    if (settings?.showDockBadge) {
      services.dock.pollingUpdateUnreadCount()
    }
  })

  return window
}

export const showSetting = (path?: string) => {
  // We need to open the setting modal in the main window when the main window exists,
  // if we open a new window then the state between the two windows will be out of sync.
  if (windows.mainWindow) {
    if (windows.mainWindow.isMinimized()) {
      windows.mainWindow.restore()
    }
    windows.mainWindow.show()

    callWindowExpose(windows.mainWindow).showSetting(path)
    return
  } else {
    windows.mainWindow = createMainWindow()
    windows.mainWindow.show()
    callWindowExpose(windows.mainWindow).showSetting(path)
  }
}

export const getMainWindow = () => windows.mainWindow

export const getMainWindowOrCreate = () => {
  if (!windows.mainWindow) {
    return createMainWindow()
  }
  return windows.mainWindow
}

export const destroyMainWindow = () => {
  windows.mainWindow?.destroy()
  windows.mainWindow = null
}
