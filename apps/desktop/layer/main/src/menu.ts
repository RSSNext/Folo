import { callWindowExpose } from "@follow/shared/bridge"
import { DEV } from "@follow/shared/constants"
import { dispatchEventOnWindow } from "@follow/shared/event"
import { name } from "@pkg"
import type { BrowserWindow, MenuItem, MenuItemConstructorOptions } from "electron"
import { Menu } from "electron"

import { isMacOS, isMAS } from "./env"
import { clearAllDataAndConfirm } from "./lib/cleaner"
import { t } from "./lib/i18n"
import { revealLogFile } from "./logger"
import { WindowManager } from "./manager/window"
import { checkForAppUpdates, quitAndInstall } from "./updater"

export const registerAppMenu = () => {
  const menus: Array<MenuItemConstructorOptions | MenuItem> = [
    ...(isMacOS
      ? ([
          {
            label: name,
            submenu: [
              {
                type: "normal",
                label: t("menu.about", { name }),
                click: () => {
                  WindowManager.showSetting("about")
                },
              },
              { type: "separator" },
              {
                label: t("menu.settings"),
                accelerator: "CmdOrCtrl+,",
                click: () => WindowManager.showSetting(),
              },
              { type: "separator" },
              { role: "services", label: t("menu.services") },
              { type: "separator" },
              { role: "hide", label: t("menu.hide", { name }) },
              { role: "hideOthers", label: t("menu.hideOthers") },
              { type: "separator" },
              {
                label: t("menu.clearAllData"),
                click: clearAllDataAndConfirm,
              },
              { role: "quit", label: t("menu.quit", { name }) },
            ],
          },
        ] as MenuItemConstructorOptions[])
      : []),

    {
      role: "fileMenu",
      label: t("menu.file"),
      submenu: [
        {
          type: "normal",
          label: t("menu.quickAdd"),
          accelerator: "CmdOrCtrl+N",
          click: () => {
            const mainWindow = WindowManager.getMainWindow()
            if (!mainWindow) return
            mainWindow.show()
            const caller = callWindowExpose(mainWindow)
            caller.quickAdd()
          },
        },

        {
          type: "normal",
          label: t("menu.discover"),
          accelerator: "CmdOrCtrl+T",
          click: () => {
            const mainWindow = WindowManager.getMainWindow()
            if (!mainWindow) return
            mainWindow.show()

            const caller = callWindowExpose(mainWindow)
            caller.goToDiscover()
          },
        },

        { type: "separator" },
        { role: "close", label: t("menu.close") },
      ],
    },
    {
      label: t("menu.edit"),
      submenu: [
        { role: "undo", label: t("menu.undo") },
        { role: "redo", label: t("menu.redo") },
        { type: "separator" },
        { role: "cut", label: t("menu.cut") },
        { role: "copy", label: t("menu.copy") },
        { role: "paste", label: t("menu.paste") },
        { type: "separator" },
        {
          type: "normal",
          label: t("menu.search"),
          accelerator: "CmdOrCtrl+F",
          click(_e, window) {
            if (!window) return
            dispatchEventOnWindow(window as BrowserWindow, "OpenSearch")
          },
        },
        ...((isMacOS
          ? [
              { role: "pasteAndMatchStyle", label: t("menu.pasteAndMatchStyle") },
              { role: "delete", label: t("menu.delete") },
              { role: "selectAll", label: t("menu.selectAll") },
              { type: "separator" },
              {
                label: t("menu.speech"),
                submenu: [
                  { role: "startSpeaking", label: t("menu.startSpeaking") },
                  { role: "stopSpeaking", label: t("menu.stopSpeaking") },
                ],
              },
            ]
          : [
              { role: "delete", label: t("menu.delete") },
              { type: "separator" },
              { role: "selectAll", label: t("menu.selectAll") },
            ]) as MenuItemConstructorOptions[]),
      ],
    },
    {
      role: "viewMenu",
      label: t("menu.view"),
      submenu: [
        { role: "reload", label: t("menu.reload") },
        { role: "forceReload", label: t("menu.forceReload") },
        { role: "toggleDevTools", label: t("menu.toggleDevTools") },
        { type: "separator" },

        { role: "togglefullscreen", label: t("menu.toggleFullScreen") },
      ],
    },
    {
      role: "windowMenu",
      label: t("menu.window"),
      submenu: [
        {
          role: "minimize",
          label: t("menu.minimize"),
        },
        {
          role: "zoom",
          label: t("menu.zoom"),
        },
        {
          type: "separator",
        },
        {
          role: "front",
          label: t("menu.front"),
        },
        {
          label: "Always on top",
          type: "checkbox",
          checked: WindowManager.getMainWindow()?.isAlwaysOnTop(),
          click: () => {
            const mainWindow = WindowManager.getMainWindow()
            if (!mainWindow) return
            mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop())
            registerAppMenu()
          },
        },
      ],
    },
    {
      role: "help",
      label: t("menu.help"),
      submenu: [
        {
          label: t("menu.openLogFile"),
          click: async () => {
            await revealLogFile()
          },
        },
        ...(!isMAS
          ? [
              {
                label: t("menu.checkForUpdates"),
                click: async () => {
                  WindowManager.getMainWindow()?.show()
                  await checkForAppUpdates()
                },
              },
            ]
          : []),
      ],
    },
  ]

  if (DEV) {
    menus.push({
      label: t("menu.debug"),
      submenu: [
        {
          label: t("menu.followReleases"),
          click: () => {
            WindowManager.createWindow({
              extraPath: `#add?url=${encodeURIComponent(
                "https://github.com/RSSNext/follow/releases.atom",
              )}`,
              width: 800,
              height: 600,
            })
          },
        },
        {
          type: "normal",
          label: t("menu.quitAndInstallUpdate"),
          click() {
            quitAndInstall()
          },
        },
      ],
    })
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus))
}
