import { fileURLToPath } from "node:url"

import { is } from "@electron-toolkit/utils"
import { LEGACY_APP_PROTOCOL } from "@follow/shared"
import { callWindowExpose, WindowState } from "@follow/shared/bridge"
import { APP_PROTOCOL, DEV } from "@follow/shared/constants"
import type { BrowserWindowConstructorOptions } from "electron"
import { app, BrowserWindow, screen, shell } from "electron"
import type { Event } from "electron/main"
import path from "pathe"

import { START_IN_TRAY_ARGS } from "~/constants/app"
import { isMacOS, isWindows, isWindows11 } from "~/env"
import { filePathToAppUrl, getIconPath } from "~/helper"
import { t } from "~/lib/i18n"
import { store } from "~/lib/store"
import { getTrayConfig } from "~/lib/tray"
import { refreshBound } from "~/lib/utils"
import { logger } from "~/logger"
import { loadDynamicRenderEntry } from "~/updater/hot-updater"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

class WindowManagerStatic {
  static readonly mainWindowDefaultSize = {
    height: 900,
    width: 1600,
  }

  // Window configuration properties for better DX
  private readonly config = {
    windowStateStoreKey: "windowState",
    minWindowSize: {
      width: 1024,
      height: 500,
    },
    macOSTrafficLight: {
      x: 18,
      y: 18,
    },
    refreshBoundDelay: 1000,
    devToolsFont: {
      family:
        'consolas, operator mono, Cascadia Code, OperatorMonoSSmLig Nerd Font, "Agave Nerd Font", "Cascadia Code PL", monospace',
      size: "13px",
    },
    ignoreProtocols: [
      "http",
      "https",
      LEGACY_APP_PROTOCOL,
      APP_PROTOCOL,
      "file",
      "code",
      "cursor",
      "app",
    ] as const,
    vibrancy: {
      macOS: {
        type: "sidebar" as const,
        state: "followWindow" as const,
      },
    },
    windowPreferences: {
      preloadScript: path.join(__dirname, "../preload/index.mjs"),
    },
  } as const

  readonly windowStateStoreKey = this.config.windowStateStoreKey

  private windows = {
    mainWindow: null as BrowserWindow | null,
  }

  private bindEvents(window: BrowserWindow) {
    window.on("leave-html-full-screen", () => {
      // To solve the vibrancy losing issue when leaving full screen mode
      // @see https://github.com/toeverything/AFFiNE/blob/280e24934a27557529479a70ab38c4f5fc65cb00/packages/frontend/electron/src/main/windows-manager/main-window.ts:L157
      refreshBound(window)
      refreshBound(window, this.config.refreshBoundDelay)
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

      if (this.config.ignoreProtocols.includes(protocol.slice(0, -1) as any)) {
        return
      }
      e.preventDefault()

      const caller = callWindowExpose(window)
      const confirm = await caller.dialog.ask({
        title: t("dialog.openExternalApp.title"),
        message: t("dialog.openExternalApp.message", {
          url,
          interpolation: { escapeValue: false },
        }),
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

    if (isWindows) {
      // Change the default font-family and font-size of the devtools.
      // Make it consistent with Chrome on Windows, instead of SimSun.
      // ref: [[Feature Request]: Add possibility to change DevTools font · Issue #42055 · electron/electron](https://github.com/electron/electron/issues/42055)
      window.webContents.on("devtools-opened", () => {
        this.setupDevToolsFont(window)
      })
    }

    this.bindWindowStateEvents(window)
  }

  private setupDevToolsFont(window: BrowserWindow) {
    // source-code-font: For code such as Elements panel
    // monospace-font: For sidebar such as Event Listener Panel
    const css = `:root {--devtool-font-family: ${this.config.devToolsFont.family};--source-code-font-family:var(--devtool-font-family);--source-code-font-size: ${this.config.devToolsFont.size};--monospace-font-family: var(--devtool-font-family);--monospace-font-size: ${this.config.devToolsFont.size};}`
    const js = `
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
                      if (item instanceof HTMLElement && item.classList.contains('editor-tooltip-host')) {
                          addStyleToAutoComplete();
                      }
                  }
              }
          }
      });
      observer.observe(document.body, {childList: true});
      function addStyleToAutoComplete() {
          document.querySelectorAll('.editor-tooltip-host').forEach(element => {
              if (element.shadowRoot && element.shadowRoot.querySelectorAll('[data-key="overridden-dev-tools-font"]').length === 0) {
                  const overriddenStyle = document.createElement('style');
                  overriddenStyle.setAttribute('data-key', 'overridden-dev-tools-font');
                  overriddenStyle.innerHTML = '.cm-tooltip-autocomplete ul[role=listbox] {font-family: consolas !important;}';
                  element.shadowRoot.append(overriddenStyle);
              }
          });
      }
    `
    window.webContents.devToolsWebContents?.executeJavaScript(js)
  }

  private bindWindowStateEvents(window: BrowserWindow) {
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
  }

  private bindMainWindowCloseHandlers(window: BrowserWindow) {
    window.on("close", () => {
      if (isWindows11) {
        const windowStoreKey = Symbol.for("maximized")
        if (window[windowStoreKey]) {
          const stored = window[windowStoreKey]
          store.set(this.windowStateStoreKey, {
            width: stored.size[0],
            height: stored.size[1],
            x: stored.position[0],
            y: stored.position[1],
          })

          return
        }
      }

      const bounds = window.getBounds()
      store.set(this.windowStateStoreKey, {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      })
    })

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
        this.windows.mainWindow = null
      }
    })
  }

  private getPlatformSpecificWindowConfig(): Partial<BrowserWindowConstructorOptions> {
    const { platform } = process

    switch (platform) {
      case "darwin": {
        return {
          titleBarStyle: "hiddenInset",
          trafficLightPosition: {
            x: this.config.macOSTrafficLight.x,
            y: this.config.macOSTrafficLight.y,
          },
          vibrancy: this.config.vibrancy.macOS.type,
          visualEffectState: this.config.vibrancy.macOS.state,
          transparent: true,
        }
      }

      case "win32": {
        return {
          icon: getIconPath(),
          titleBarStyle: "hidden",
          // Electron material bug, comment this for now
          // backgroundMaterial: isWindows11 ? "mica" : undefined,
          frame: true,
        }
      }

      default: {
        return {
          icon: getIconPath(),
        }
      }
    }
  }

  createWindow = (
    options: {
      extraPath?: string
      height: number
      width: number
    } & BrowserWindowConstructorOptions,
  ) => {
    const { extraPath, height, width, ...configs } = options

    const baseWindowConfig: Electron.BrowserWindowConstructorOptions = {
      width,
      height,
      show: false,
      resizable: configs?.resizable ?? true,
      autoHideMenuBar: true,
      alwaysOnTop: false,
      webPreferences: {
        preload: this.config.windowPreferences.preloadScript,
        sandbox: false,
        webviewTag: true,
        webSecurity: !DEV,
        nodeIntegration: true,
        contextIsolation: false,
      },
      ...this.getPlatformSpecificWindowConfig(),
    }

    // Create the browser window.
    const window = new BrowserWindow({
      ...baseWindowConfig,
      ...configs,
    })

    this.bindEvents(window)

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      window.loadURL(process.env["ELECTRON_RENDERER_URL"] + (options?.extraPath || ""))
      logger.log(process.env["ELECTRON_RENDERER_URL"] + (options?.extraPath || ""))
    } else {
      // Production entry
      const dynamicRenderEntry = loadDynamicRenderEntry()
      logger.info("load dynamic render entry", dynamicRenderEntry)
      const appLoadFileEntry =
        dynamicRenderEntry || path.resolve(__dirname, "../renderer/index.html")

      const appLoadEntry = `${filePathToAppUrl(appLoadFileEntry)}${options?.extraPath || ""}`

      window.loadURL(appLoadEntry)
      logger.log("load URL", appLoadEntry)
    }

    return window
  }

  private ensureWindowBoundsInScreen(windowState?: {
    width?: number
    height?: number
    x?: number
    y?: number
  }) {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { workArea } = primaryDisplay

    const maxWidth = workArea.width
    const maxHeight = workArea.height

    const defaultSize = WindowManagerStatic.mainWindowDefaultSize

    const width = Math.min(windowState?.width || defaultSize.width, maxWidth)
    const height = Math.min(windowState?.height || defaultSize.height, maxHeight)

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

    return { width, height, x, y, maxWidth, maxHeight }
  }

  createMainWindow = () => {
    const windowState = store.get(this.windowStateStoreKey) as
      | {
          width?: number
          height?: number
          x?: number
          y?: number
        }
      | undefined
    const { width, height, x, y, maxWidth, maxHeight } =
      this.ensureWindowBoundsInScreen(windowState)

    const window = this.createWindow({
      width,
      height,
      x,
      y,
      minWidth: Math.min(this.config.minWindowSize.width, maxWidth),
      minHeight: Math.min(this.config.minWindowSize.height, maxHeight),
    })

    this.bindMainWindowCloseHandlers(window)

    this.windows.mainWindow = window

    return window
  }

  showSetting = (path?: string) => {
    // We need to open the setting modal in the main window when the main window exists,
    // if we open a new window then the state between the two windows will be out of sync.
    if (this.windows.mainWindow) {
      if (this.windows.mainWindow.isMinimized()) {
        this.windows.mainWindow.restore()
      }
      this.windows.mainWindow.show()

      callWindowExpose(this.windows.mainWindow).showSetting(path)
      return
    } else {
      this.windows.mainWindow = this.createMainWindow()
      this.windows.mainWindow.show()
      callWindowExpose(this.windows.mainWindow).showSetting(path)
    }
  }

  getMainWindow = () => this.windows.mainWindow

  getMainWindowOrCreate = () => {
    if (!this.windows.mainWindow) {
      return this.createMainWindow()
    }
    return this.windows.mainWindow
  }

  destroyMainWindow = () => {
    this.windows.mainWindow?.destroy()
    this.windows.mainWindow = null
  }
}

export const WindowManager = new WindowManagerStatic()
