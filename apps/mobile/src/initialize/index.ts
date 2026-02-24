import { initializeDB } from "@follow/database/db"
import { hydrateDatabaseToStore } from "@follow/store/hydrate"
import { whoami } from "@follow/store/user/getters"
import { userSyncService } from "@follow/store/user/store"
import { tracker } from "@follow/tracker"
import { nativeApplicationVersion } from "expo-application"

import { migrateLegacyApiSession } from "../lib/auth-cookie-migration"
import { settingSyncQueue } from "../modules/settings/sync-queue"
import { initAnalytics } from "./analytics"
import { initializeAppCheck } from "./app-check"
import { initBackgroundTask } from "./background"
import { initializeDayjs } from "./dayjs"
import { initDeviceType } from "./device"
import { hydrateQueryClient, hydrateSettings } from "./hydrate"
import { migrateDatabase } from "./migration"
import { initializePlayer } from "./player"

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

/* eslint-disable no-console */
export const initializeApp = async () => {
  console.log(`Initialize...`)

  const now = Date.now()

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
    apm("initializePlayer", initializePlayer)
  })
  await initAnalytics()

  void apm("setting sync", async () => {
    await settingSyncQueue.init()

    await userSyncService.whoami().catch(() => null)

    if (!whoami()) {
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
  console.log(`Initialize done,`, `${loadingTime}ms`)
}

const apm = async (label: string, fn: () => Promise<any> | any) => {
  const start = Date.now()
  const result = await fn()
  const end = Date.now()
  console.log(`${label} took ${end - start}ms`)
  return result
}
