import { createRequire } from "node:module"

import { app, nativeTheme } from "electron"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { WindowManager } from "~/manager/window"

import { setProxyConfig, updateProxy } from "../../lib/proxy"
import { store } from "../../lib/store"
import { getTrayConfig, setTrayConfig } from "../../lib/tray"

const require = createRequire(import.meta.url)

interface SetLoginItemSettingsInput {
  openAtLogin: boolean
  openAsHidden?: boolean
  path?: string
  args?: string[]
}

export class SettingService extends IpcService {
  static override readonly groupName = "setting"

  @IpcMethod()
  getLoginItemSettings(): Electron.LoginItemSettings {
    return app.getLoginItemSettings()
  }

  @IpcMethod()
  setLoginItemSettings(input: SetLoginItemSettingsInput): void {
    app.setLoginItemSettings(input)
  }

  @IpcMethod()
  openSettingWindow(): void {
    WindowManager.showSetting()
  }

  @IpcMethod()
  async getSystemFonts(): Promise<string[]> {
    const fonts = await require("font-list").getFonts()
    return fonts.map((font: string) => font.replaceAll('"', ""))
  }

  @IpcMethod()
  getAppearance(): "light" | "dark" | "system" {
    return nativeTheme.themeSource
  }

  @IpcMethod()
  setAppearance(appearance: "light" | "dark" | "system"): void {
    nativeTheme.themeSource = appearance
    store.set("appearance", appearance)
  }

  @IpcMethod()
  getMinimizeToTray(): boolean {
    return getTrayConfig()
  }

  @IpcMethod()
  setMinimizeToTray(minimize: boolean): boolean {
    return setTrayConfig(minimize)
  }

  @IpcMethod()
  getProxyConfig() {
    const proxy = store.get("proxy")
    return proxy ?? undefined
  }

  @IpcMethod()
  setProxyConfig(config: string) {
    const result = setProxyConfig(config)
    updateProxy()
    return result
  }

  @IpcMethod()
  getMessagingToken(): string | null {
    return store.get("notifications-credentials") as string | null
  }
}
