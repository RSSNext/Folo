import { name } from "@pkg"
import { app, Menu, nativeImage, Tray } from "electron"

import { isMacOS, isMAS, isWindows } from "~/env"
import { getTrayIconPath } from "~/helper"
import { logger, revealLogFile } from "~/logger"
import { WindowManager } from "~/manager/window"
import { checkForAppUpdates } from "~/updater"

import { getDockCount } from "./dock"
import { t } from "./i18n"
import { store } from "./store"

// https://www.electronjs.org/docs/latest/tutorial/tray

let tray: Tray | null = null

const getTrayContextMenu = () => {
  const count = getDockCount()
  return Menu.buildFromTemplate([
    ...(count
      ? [
          {
            label: `${t("menu.unread")} ${count}`,
            enabled: false,
          },
        ]
      : []),
    {
      label: t("menu.open", { name }),
      click: showWindow,
    },
    {
      label: t("menu.help"),
      submenu: [
        {
          label: t("menu.reload"),
          click: () => {
            const mainWindow = WindowManager.getMainWindowOrCreate()
            mainWindow.webContents.reload()
          },
        },
        {
          label: t("menu.toggleDevTools"),
          click: () => {
            const mainWindow = WindowManager.getMainWindowOrCreate()
            mainWindow.webContents.toggleDevTools()
          },
        },
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
                  showWindow()
                  await checkForAppUpdates()
                },
              },
            ]
          : []),
      ],
    },
    {
      label: t("menu.quit", { name }),
      click: () => {
        logger.info("Quit app from tray")
        app.quit()
      },
    },
  ])
}
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

  tray.setContextMenu(getTrayContextMenu())
  tray.setToolTip(app.getName())
  tray.on("mouse-enter", () => {
    tray?.setContextMenu(getTrayContextMenu())
  })
  if (isWindows) {
    tray.on("click", showWindow)
  }
}

const showWindow = () => {
  const mainWindow = WindowManager.getMainWindowOrCreate()
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
