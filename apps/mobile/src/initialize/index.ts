import { initializeDB } from "@follow/database/db"
import { hydrateDatabaseToStore } from "@follow/store/hydrate"
import { ensureSyncedThroughEngine } from "@follow/store/sync/sync-status"
import { whoami } from "@follow/store/user/getters"
import { fetchSessionUser } from "@follow/store/user/hooks"
import { tracker } from "@follow/tracker"
import { nativeApplicationVersion } from "expo-application"

import { migrateLegacyApiSession } from "../lib/auth-cookie-migration"
import { applyStoredAppColorScheme } from "../lib/color-scheme"
import { pruneUnusedTtsFiles } from "../modules/player/entry-tts"
import { settingSyncQueue } from "../modules/settings/sync-queue"
import { initAnalytics } from "./analytics"
import { initializeAppCheck } from "./app-check"
import { initBackgroundTask } from "./background"
import { initializeDayjs } from "./dayjs"
import { initDeviceType } from "./device"
import { hydrateQueryClient, hydrateSettings } from "./hydrate"
import { migrateDatabase } from "./migration"
import { initializePlayer } from "./player"
import { initSyncTriggers } from "./sync"

type RequestIdleCallback = (callback: () => void, options?: { timeout?: number }) => number

const runWhenIdle = (callback: () => void) => {
  const requestIdle = (globalThis as { requestIdleCallback?: RequestIdleCallback })
    .requestIdleCallback

  if (requestIdle) {
    requestIdle(callback, { timeout: 5000 })
    return
  }

  setTimeout(callback, 0)
}

export const initializeApp = async () => {
  console.log(`Initialize...`)

  const now = Date.now()

  // Apply the persisted color scheme before the first frame to avoid a theme flash.
  applyStoredAppColorScheme()

  await initDeviceType()
  await initializeDB()
  void apm("migrateLegacyApiSession", migrateLegacyApiSession).catch((error) => {
    console.error("migrateLegacyApiSession failed", error)
  })

  await apm("migrateDatabase", migrateDatabase)
  initializeDayjs()

  await apm("hydrateSettings", hydrateSettings)
  let dataHydratedTime = Date.now()
  await apm("hydrateDatabaseToStore", () => {
    return hydrateDatabaseToStore()
  })

  dataHydratedTime = Date.now() - dataHydratedTime
  await apm("hydrateQueryClient", hydrateQueryClient)
  await apm("initializeAppCheck", initializeAppCheck)
  runWhenIdle(() => {
    // Prune TTS files of earlier sessions once the player can tell which one it still plays
    void apm("initializePlayer", initializePlayer).then(pruneUnusedTtsFiles)
  })
  await initAnalytics()

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
    console.error("setting sync failed", error)
    void tracker.manager.captureException(error, {
      module: "setting_sync",
      stage: "bootstrap",
    })
  })
  const loadingTime = Date.now() - now
  tracker.appInit({
    rn: true,
    loading_time: loadingTime,
    version: nativeApplicationVersion!,
    data_hydrated_time: dataHydratedTime,
    electron: false,
    using_indexed_db: true,
  })

  initBackgroundTask()
  initSyncTriggers()
  console.log(`Initialize done,`, `${loadingTime}ms`)
}

const apm = async (label: string, fn: () => Promise<any> | any) => {
  const start = Date.now()
  const result = await fn()
  const end = Date.now()
  console.log(`${label} took ${end - start}ms`)
  return result
}
