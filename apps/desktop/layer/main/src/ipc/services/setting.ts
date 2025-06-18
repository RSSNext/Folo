import { createRequire } from "node:module"

import { app, nativeTheme } from "electron"

import { setProxyConfig, updateProxy } from "../../lib/proxy"
import { store } from "../../lib/store"
import { getTrayConfig, setTrayConfig } from "../../lib/tray"
import { showSetting } from "../../window"
import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

const require = createRequire(import.meta.url)

interface SetLoginItemSettingsInput {
  openAtLogin: boolean
  openAsHidden?: boolean
  path?: string
  args?: string[]
}

export class SettingService extends IpcService {
  constructor() {
    super("setting")
  }

  @IpcMethod()
  getLoginItemSettings(_context: IpcContext): Electron.LoginItemSettings {
    return app.getLoginItemSettings()
  }

  @IpcMethod()
  setLoginItemSettings(_context: IpcContext, input: SetLoginItemSettingsInput): void {
    app.setLoginItemSettings(input)
  }

  @IpcMethod()
  openSettingWindow(_context: IpcContext): void {
    showSetting()
  }

  @IpcMethod()
  async getSystemFonts(_context: IpcContext): Promise<string[]> {
    const fonts = await require("font-list").getFonts()
    return fonts.map((font: string) => font.replaceAll('"', ""))
  }

  @IpcMethod()
  getAppearance(_context: IpcContext): "light" | "dark" | "system" {
    return nativeTheme.themeSource
  }

  @IpcMethod()
  setAppearance(_context: IpcContext, appearance: "light" | "dark" | "system"): void {
    nativeTheme.themeSource = appearance
  }

  @IpcMethod()
  getMinimizeToTray(_context: IpcContext): boolean {
    return getTrayConfig()
  }

  @IpcMethod()
  setMinimizeToTray(_context: IpcContext, minimize: boolean): void {
    setTrayConfig(minimize)
  }

  @IpcMethod()
  getProxyConfig(_context: IpcContext) {
    const proxy = store.get("proxy")
    return proxy ?? undefined
  }

  @IpcMethod()
  setProxyConfig(_context: IpcContext, config: string) {
    const result = setProxyConfig(config)
    updateProxy()
    return result
  }

  @IpcMethod()
  getMessagingToken(_context: IpcContext): string | null {
    return store.get("notifications-credentials") as string | null
  }
}
