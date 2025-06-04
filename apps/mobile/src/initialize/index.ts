import { initializeDb } from "@follow/database/db"
import { hydrateDatabaseToStore } from "@follow/store/hydrate"
import { tracker } from "@follow/tracker"
import { nativeApplicationVersion } from "expo-application"

import { getGeneralSettings } from "../atoms/settings/general"
import { settingSyncQueue } from "../modules/settings/sync-queue"
import { initAnalytics } from "./analytics"
import { initializeAppCheck } from "./app-check"
import { initBackgroundTask } from "./background"
import { initCrashlytics } from "./crashlytics"
import { initializeDayjs } from "./dayjs"
import { initDeviceType } from "./device"
import { hydrateQueryClient, hydrateSettings } from "./hydrate"
import { migrateDatabase } from "./migration"
import { initializePlayer } from "./player"

/* eslint-disable no-console */
export const initializeApp = async () => {
  console.log(`Initialize...`)

  const now = Date.now()

  await initDeviceType()
  initializeDb()

  await apm("migrateDatabase", migrateDatabase)
  initializeDayjs()

  await apm("hydrateSettings", hydrateSettings)
  let dataHydratedTime = Date.now()
  await apm("hydrateDatabaseToStore", () => {
    const { hidePrivateSubscriptionsInTimeline, unreadOnly } = getGeneralSettings()
    return hydrateDatabaseToStore({
      hidePrivateSubscriptionsInTimeline,
      unreadOnly,
    })
  })

  dataHydratedTime = Date.now() - dataHydratedTime
  await apm("hydrateQueryClient", hydrateQueryClient)
  await apm("initializeAppCheck", initializeAppCheck)
  await apm("initializePlayer", initializePlayer)

  apm("setting sync", () => {
    settingSyncQueue.init()
    settingSyncQueue.syncLocal()
  })

  await initAnalytics()
  const loadingTime = Date.now() - now
  tracker.appInit({
    rn: true,
    loading_time: loadingTime,
    version: nativeApplicationVersion!,
    data_hydrated_time: dataHydratedTime,
    electron: false,
    using_indexed_db: true,
  })
  initCrashlytics()
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
