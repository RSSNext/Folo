import { name } from "@pkg"
import { app, Menu, nativeImage, Tray } from "electron"

import { isMacOS } from "~/env"
import { getTrayIconPath } from "~/helper"

import { getMainWindowOrCreate } from "../window"
import { t } from "./i18n"
import { store } from "./store"

// https://www.electronjs.org/docs/latest/tutorial/tray

let tray: Tray | null = null

export const registerAppTray = () => {
  if (!getTrayConfig()) return
  if (tray) {
    destroyAppTray()
  }

  const icon = nativeImage.createFromPath(getTrayIconPath())
  // See https://stackoverflow.com/questions/41664208/electron-tray-icon-change-depending-on-dark-theme/41998326#41998326
  const trayIcon = isMacOS ? icon.resize({ width: 16 }) : icon
  trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: t("menu.open", { name }),
      click: showWindow,
    },
    { label: t("menu.quit", { name }), click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)
  tray.setToolTip(app.getName())
  tray.on("click", showWindow)
}

const showWindow = () => {
  const mainWindow = getMainWindowOrCreate()
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  } else {
    mainWindow.show()
  }
}

const destroyAppTray = () => {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

const DEFAULT_MINIMIZE_TO_TRAY = isMacOS ? false : true

export const getTrayConfig = () => store.get("minimizeToTray") ?? DEFAULT_MINIMIZE_TO_TRAY

export const setTrayConfig = (input: boolean) => {
  store.set("minimizeToTray", input)
  if (input) {
    registerAppTray()
  } else {
    destroyAppTray()
  }
}
