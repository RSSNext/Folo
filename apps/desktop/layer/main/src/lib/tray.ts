import { name } from "@pkg"
import { app, Menu, nativeImage, Tray } from "electron"

import { isLinux, isMacOS, isMAS, isWindows } from "~/env"
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

const refreshTrayContextMenu = () => {
  if (!tray) return

  tray.setContextMenu(getTrayContextMenu())
  tray.setToolTip(app.getName())
}

export const registerAppTray = () => {
  if (!getTrayConfig()) return
  if (tray) {
    refreshTrayContextMenu()
    return
  }

  const icon = nativeImage.createFromPath(getTrayIconPath())
  // See https://stackoverflow.com/questions/41664208/electron-tray-icon-change-depending-on-dark-theme/41998326#41998326
  const trayIcon = isMacOS ? icon.resize({ width: 16 }) : icon
  trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)

  refreshTrayContextMenu()
  tray.on("mouse-enter", () => {
    refreshTrayContextMenu()
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
  if (!tray) return

  // On Linux, `Tray.destroy()` does not remove the icon from StatusNotifierItem
  // trays (waybar, KDE Plasma, …). Chromium's StatusIconLinuxDbus un-exports its
  // own D-Bus objects but never tells `org.kde.StatusNotifierWatcher` the item
  // is gone, and the item is registered by object path on the process-wide
  // session-bus connection whose name outlives the tray — so the host gets no
  // `NameOwnerChanged` and keeps a dead icon. Toggling `minimizeToTray` back on
  // then stacks a *second* icon (Chromium bumps its global StatusNotifierItem
  // id), with only the newest menu wired to live handlers. The whole pile only
  // clears when the app fully exits.
  //
  // Keep the single Tray instance for the app's lifetime on Linux. The window
  // close handler reads `getTrayConfig()` on every close, so a tray icon that
  // outlives a disabled setting is inert; the renderer asks the user to restart
  // to actually remove it (see `setTrayConfig`'s return value).
  //
  // Refs: #3940, #4985, #3207
  if (isLinux) return

  tray.destroy()
  tray = null
}

const DEFAULT_MINIMIZE_TO_TRAY = false

export const getTrayConfig = () => store.get("minimizeToTray") ?? DEFAULT_MINIMIZE_TO_TRAY

/**
 * @returns `true` when the change could not be applied to the tray icon live and
 * the app must be restarted for it to take effect (Linux disabling only).
 */
export const setTrayConfig = (input: boolean): boolean => {
  store.set("minimizeToTray", input)
  if (input) {
    registerAppTray()
    return false
  }

  // `destroyAppTray()` can't remove the icon on Linux (see above); report that a
  // restart is needed so the renderer can offer it.
  const needsRestart = isLinux && tray !== null
  destroyAppTray()
  return needsRestart
}
