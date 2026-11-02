import { initializeDayjs } from "@follow/components/dayjs"
import { registerGlobalContext } from "@follow/shared/bridge"
import { DEV, ELECTRON_BUILD, IN_ELECTRON } from "@follow/shared/constants"
import { hydrateDatabaseToStore } from "@follow/store/hydrate"
import { onLocalDataOfAnotherAccount } from "@follow/store/sync/account"
import { ensureSyncedThroughEngine } from "@follow/store/sync/sync-status"
import { whoami } from "@follow/store/user/getters"
import { fetchSessionUser } from "@follow/store/user/hooks"
import { tracker } from "@follow/tracker"
import { repository } from "@pkg"
import { enableMapSet } from "immer"

import { initI18n } from "~/i18n"
import { hydrateSessionsFromLocalDb } from "~/modules/ai-chat-session"
import { settingSyncQueue } from "~/modules/settings/helper/sync-queue"
import { ElectronCloseEvent, ElectronShowEvent } from "~/providers/invalidate-query-provider"
import { clearLocalDataOfAnotherAccount } from "~/store/utils/clear"

import { appLog } from "../lib/log"
import { initAnalytics } from "./analytics"
import { registerHistoryStack } from "./history"
import { doMigration } from "./migrates"
import { initializeSettings } from "./settings"
import { initSyncTriggers } from "./sync"

declare global {
  interface Window {
    version: string
  }
}

let clearingForAnotherAccount = false

export const initializeApp = async () => {
  appLog(`${APP_NAME}: Follow everything in one place`, repository.url)

  // Before any session answer can arrive: the data on this device must not be shown to, or
  // sent with the session of, another account.
  onLocalDataOfAnotherAccount(() => {
    if (clearingForAnotherAccount) return
    clearingForAnotherAccount = true
    void clearLocalDataOfAnotherAccount()
  })

  const dataHydratedTime = await apm("hydrateDatabaseToStore", () => {
    return hydrateDatabaseToStore({
      migrateDatabase: true,
    })
  })
  initSyncTriggers()

  if (DEV) {
    const url = "/favicon-dev.ico"

    // Change favicon
    const $icon = document.head.querySelector("link[rel='icon']")
    if ($icon) {
      $icon.setAttribute("href", url)
    } else {
      const icon = document.createElement("link")
      icon.setAttribute("rel", "icon")
      icon.setAttribute("href", url)
      document.head.append(icon)
    }
  }

  appLog(`Initialize ${APP_NAME}...`)
  window.version = APP_VERSION

  const now = Date.now()
  initializeDayjs()
  registerHistoryStack()

  hydrateSessionsFromLocalDb()
  // Set Environment
  document.documentElement.dataset.buildType = ELECTRON_BUILD ? "electron" : "web"

  // Register global context for electron
  registerGlobalContext({
    /**
     * Electron app only
     */
    onWindowClose() {
      document.dispatchEvent(new ElectronCloseEvent())
    },
    onWindowShow() {
      document.dispatchEvent(new ElectronShowEvent())
    },
  })

  apm("migration", doMigration)

  // Enable Map/Set in immer
  enableMapSet()

  apm("initializeSettings", initializeSettings)

  await apm("i18n", initI18n)
  await apm("initAnalytics", initAnalytics)

  void apm("setting sync", async () => {
    await settingSyncQueue.init()

    await fetchSessionUser().catch(() => null)

    if (!whoami()) {
      return
    }
    // With a sync cursor the settings were loaded in full once and are kept current by the
    // change log (see the "setting" model in the sync queue). Only servers without it still
    // need the full request on every launch.
    if (await ensureSyncedThroughEngine()) {
      return
    }
    await settingSyncQueue.syncLocal()
  }).catch((error) => {
    appLog("setting sync failed", error)
    void tracker.manager.captureException(error, {
      module: "setting_sync",
      stage: "bootstrap",
    })
  })

  const loadingTime = Date.now() - now
  appLog(`Initialize ${APP_NAME} done,`, `${loadingTime}ms`)

  tracker.appInit({
    electron: IN_ELECTRON,
    loading_time: loadingTime,
    data_hydrated_time: dataHydratedTime,
    version: APP_VERSION,
    rn: false,
  })
}

const apm = async (label: string, fn: () => Promise<any> | any) => {
  const start = Date.now()
  const result = await fn()
  const end = Date.now()
  appLog(`${label} took ${end - start}ms`)
  return result
}
