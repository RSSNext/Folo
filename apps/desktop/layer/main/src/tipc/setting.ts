import { createRequire } from "node:module"

import { app, nativeTheme } from "electron"

import { START_IN_TRAY_ARGS } from "~/constants/app"
import { getTrayConfig, setTrayConfig } from "~/lib/tray"

import { setDockCount } from "../lib/dock"
import { setProxyConfig, updateProxy } from "../lib/proxy"
import { store } from "../lib/store"
import { showSetting } from "../window"
import { t } from "./_instance"

const require = createRequire(import.meta.url)
export const settingRoute = {
  getLoginItemSettings: t.procedure.input<void>().action(async () => app.getLoginItemSettings()),
  setLoginItemSettings: t.procedure.input<boolean>().action(async ({ input }) => {
    app.setLoginItemSettings({
      openAtLogin: input,
      openAsHidden: true,
      args: [START_IN_TRAY_ARGS],
    })
  }),
  openSettingWindow: t.procedure.action(async () => showSetting()),
  getSystemFonts: t.procedure.action(
    async (): Promise<string[]> =>
      new Promise((resolve) => {
        // NOTE: should external font-list deps
        // use `require` to avoid bundling, vite behavior
        require("font-list")
          .getFonts()
          .then((fonts) => {
            resolve(fonts.map((font) => font.replaceAll('"', "")))
          })
      }),
  ),
  getAppearance: t.procedure.action(async () => nativeTheme.themeSource),
  setAppearance: t.procedure.input<"light" | "dark" | "system">().action(async ({ input }) => {
    nativeTheme.themeSource = input

    store.set("appearance", input)
  }),
  getMinimizeToTray: t.procedure.action(async () => getTrayConfig()),
  setMinimizeToTray: t.procedure.input<boolean>().action(async ({ input }) => setTrayConfig(input)),
  setDockBadge: t.procedure.input<number>().action(async ({ input }) => {
    setDockCount(input)
  }),
  getProxyConfig: t.procedure.action(async () => store.get("proxy")),
  setProxyConfig: t.procedure.input<string>().action(async ({ input }) => {
    const result = setProxyConfig(input)
    updateProxy()
    return result
  }),
  getMessagingToken: t.procedure.action(async () => {
    return store.get("notifications-credentials")
  }),
}
