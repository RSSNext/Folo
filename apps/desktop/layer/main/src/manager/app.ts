import { PushReceiver } from "@eneris/push-receiver"
import { callWindowExpose } from "@follow/shared/bridge"
import { APP_PROTOCOL, DEV, LEGACY_APP_PROTOCOL } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import type { MessagingData } from "@follow/shared/hono"
import { app, nativeTheme, Notification, shell } from "electron"
import contextMenu from "electron-context-menu"
import path from "pathe"

import { WindowManager } from "~/manager/window"

import { getIconPath } from "../helper"
import { initializeIpcServices } from "../ipc"
import { checkAndCleanCodeCache, clearCacheCronJob } from "../lib/cleaner"
import { t } from "../lib/i18n"
import { updateProxy } from "../lib/proxy"
import { store } from "../lib/store"
import { registerAppTray } from "../lib/tray"
import { updateNotificationsToken } from "../lib/user"
import { logger } from "../logger"
import { registerAppMenu } from "../menu"
import { registerUpdater } from "../updater"
import { LifecycleManager } from "./lifecycle"

class AppManagerStatic {
  private static instance: AppManagerStatic

  public static getInstance(): AppManagerStatic {
    if (!AppManagerStatic.instance) {
      AppManagerStatic.instance = new AppManagerStatic()
    }
    return AppManagerStatic.instance
  }

  public init() {
    initializeIpcServices()
    LifecycleManager.onReady(this.onReady.bind(this))
  }

  private onReady() {
    this.registerProtocols()
    this.setupAppVisuals()
    this.setupSystemConfigs()
    this.runCronJobs()
    this.registerMenuAndContextMenu()
    this.registerPushNotifications()

    updateProxy()
    registerUpdater()
    registerAppTray()
  }

  private registerProtocols() {
    const protocols = [LEGACY_APP_PROTOCOL, APP_PROTOCOL]

    for (const protocolName of protocols) {
      if (process.defaultApp) {
        if (process.argv.length >= 2) {
          app.setAsDefaultProtocolClient(protocolName, process.execPath, [
            path.resolve(process.argv[1]!),
          ])
        }
      } else {
        app.setAsDefaultProtocolClient(protocolName)
      }
    }
  }

  private setupAppVisuals() {
    if (app.dock) {
      app.dock.setIcon(getIconPath())
    }
  }

  private setupSystemConfigs() {
    const appearance = store.get("appearance")
    if (appearance && ["light", "dark", "system"].includes(appearance)) {
      nativeTheme.themeSource = appearance
    }
  }

  private runCronJobs() {
    clearCacheCronJob()
    checkAndCleanCodeCache()
  }

  private async registerPushNotifications() {
    if (!env.VITE_FIREBASE_CONFIG) {
      return
    }

    const credentialsKey = "notifications-credentials"
    const persistentIdsKey = "notifications-persistent-ids"
    const credentials = store.get(credentialsKey)
    const persistentIds = store.get(persistentIdsKey)

    const instance = new PushReceiver({
      debug: true,
      firebase: JSON.parse(env.VITE_FIREBASE_CONFIG),
      persistentIds: persistentIds || [],
      credentials: credentials || undefined,
      bundleId: "is.follow",
      chromeId: "is.follow",
    })
    logger.info(
      `PushReceiver initialized with credentials ${JSON.stringify(credentials)} and firebase config ${
        env.VITE_FIREBASE_CONFIG
      }`,
    )

    instance.onReady(() => {
      logger.info("PushReceiver ready")
    })

    instance.onCredentialsChanged(({ newCredentials }) => {
      logger.info(`PushReceiver credentials changed to ${newCredentials?.fcm?.token}`)
      updateNotificationsToken(newCredentials)
    })

    instance.onNotification((notification) => {
      logger.info(
        `PushReceiver received notification: ${JSON.stringify(notification.message.data)}`,
      )
      const data = notification.message.data as MessagingData
      switch (data.type) {
        case "new-entry": {
          const notification = new Notification({
            title: data.title,
            body: data.description,
          })
          notification.on("click", () => {
            const mainWindow = WindowManager.getMainWindowOrCreate()
            mainWindow.restore()
            mainWindow.focus()
            const handlers = callWindowExpose(mainWindow)
            handlers.navigateEntry({
              feedId: data.feedId,
              entryId: data.entryId,
              view: Number.parseInt(data.view),
            })
          })
          notification.show()
          break
        }
        default: {
          break
        }
      }
      store.set(persistentIdsKey, instance.persistentIds)
    })

    try {
      await instance.connect()
    } catch (error) {
      logger.error(`PushReceiver error: ${error instanceof Error ? error.stack : error}`)
    }

    logger.info("PushReceiver connected")
  }

  private contextMenuDisposer?: () => void
  public registerMenuAndContextMenu() {
    registerAppMenu()
    if (this.contextMenuDisposer) {
      this.contextMenuDisposer()
    }

    this.contextMenuDisposer = contextMenu({
      showSaveImageAs: true,
      showCopyLink: true,
      showCopyImageAddress: true,
      showCopyImage: true,
      showInspectElement: DEV,
      showSelectAll: true,
      showCopyVideoAddress: true,
      showSaveVideoAs: true,

      labels: {
        saveImageAs: t("contextMenu.saveImageAs"),
        copyLink: t("contextMenu.copyLink"),
        copyImageAddress: t("contextMenu.copyImageAddress"),
        copyImage: t("contextMenu.copyImage"),
        copyVideoAddress: t("contextMenu.copyVideoAddress"),
        saveVideoAs: t("contextMenu.saveVideoAs"),
        inspect: t("contextMenu.inspect"),
        copy: t("contextMenu.copy"),
        cut: t("contextMenu.cut"),
        paste: t("contextMenu.paste"),
        saveImage: t("contextMenu.saveImage"),
        saveVideo: t("contextMenu.saveVideo"),
        selectAll: t("contextMenu.selectAll"),
        services: t("contextMenu.services"),
        searchWithGoogle: t("contextMenu.searchWithGoogle"),
        learnSpelling: t("contextMenu.learnSpelling"),
        lookUpSelection: t("contextMenu.lookUpSelection"),
        saveLinkAs: t("contextMenu.saveLinkAs"),
      },

      prepend: (_defaultActions, params) => {
        return [
          {
            label: t("contextMenu.openImageInBrowser"),
            visible: params.mediaType === "image",
            click: () => {
              shell.openExternal(params.srcURL)
            },
          },
          {
            label: t("contextMenu.openLinkInBrowser"),
            visible: params.linkURL !== "",
            click: () => {
              shell.openExternal(params.linkURL)
            },
          },
          {
            role: "undo",
            label: t("menu.undo"),
            accelerator: "CmdOrCtrl+Z",
            visible: params.isEditable,
          },
          {
            role: "redo",
            label: t("menu.redo"),
            accelerator: "CmdOrCtrl+Shift+Z",
            visible: params.isEditable,
          },
        ]
      },
    })
  }
}

export const AppManager = AppManagerStatic.getInstance()
