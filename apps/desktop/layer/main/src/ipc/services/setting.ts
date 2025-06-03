import { createRequire } from "node:module"

import { app, nativeTheme } from "electron"

import { START_IN_TRAY_ARGS } from "../../constants/app"
import { setDockCount } from "../../lib/dock"
import { setProxyConfig, updateProxy } from "../../lib/proxy"
import { store } from "../../lib/store"
import { getTrayConfig, setTrayConfig } from "../../lib/tray"
import { showSetting } from "../../window"
import type { IpcContext } from "../base"
import { IpcService } from "../base"

const require = createRequire(import.meta.url)

export class SettingService extends IpcService {
  constructor() {
    super("setting")
  }

  protected registerMethods(): void {
    this.registerMethod("getLoginItemSettings", this.getLoginItemSettings.bind(this))
    this.registerMethod("setLoginItemSettings", this.setLoginItemSettings.bind(this))
    this.registerMethod("openSettingWindow", this.openSettingWindow.bind(this))
    this.registerMethod("getSystemFonts", this.getSystemFonts.bind(this))
    this.registerMethod("getAppearance", this.getAppearance.bind(this))
    this.registerMethod("setAppearance", this.setAppearance.bind(this))
    this.registerMethod("getMinimizeToTray", this.getMinimizeToTray.bind(this))
    this.registerMethod("setMinimizeToTray", this.setMinimizeToTray.bind(this))
    this.registerMethod("setDockBadge", this.setDockBadge.bind(this))
    this.registerMethod("getProxyConfig", this.getProxyConfig.bind(this))
    this.registerMethod("setProxyConfig", this.setProxyConfig.bind(this))
    this.registerMethod("getMessagingToken", this.getMessagingToken.bind(this))
  }

  async getLoginItemSettings(_context: IpcContext): Promise<Electron.LoginItemSettings> {
    return app.getLoginItemSettings()
  }

  async setLoginItemSettings(_context: IpcContext, input: boolean): Promise<void> {
    app.setLoginItemSettings({
      openAtLogin: input,
      openAsHidden: true,
      args: [START_IN_TRAY_ARGS],
    })
  }

  async openSettingWindow(_context: IpcContext): Promise<void> {
    await showSetting()
  }

  async getSystemFonts(_context: IpcContext): Promise<string[]> {
    return new Promise((resolve) => {
      require("font-list")
        .getFonts()
        .then((fonts: any[]) => {
          resolve(fonts.map((font) => font.replaceAll('"', "")))
        })
    })
  }

  async getAppearance(_context: IpcContext): Promise<"light" | "dark" | "system"> {
    return nativeTheme.themeSource
  }

  async setAppearance(_context: IpcContext, input: "light" | "dark" | "system"): Promise<void> {
    nativeTheme.themeSource = input
    store.set("appearance", input)
  }

  async getMinimizeToTray(_context: IpcContext): Promise<boolean> {
    return getTrayConfig()
  }

  async setMinimizeToTray(_context: IpcContext, input: boolean): Promise<void> {
    await setTrayConfig(input)
  }

  async setDockBadge(_context: IpcContext, input: number): Promise<void> {
    setDockCount(input)
  }

  async getProxyConfig(_context: IpcContext): Promise<string | undefined> {
    const proxy = store.get("proxy")
    return proxy ?? undefined
  }

  async setProxyConfig(_context: IpcContext, input: string): Promise<any> {
    const result = setProxyConfig(input)
    updateProxy()
    return result
  }

  async getMessagingToken(_context: IpcContext): Promise<any> {
    return store.get("notifications-credentials")
  }
}
