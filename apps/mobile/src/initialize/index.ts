import { tracker } from "@follow/tracker"
import { nativeApplicationVersion } from "expo-application"

import { initializeDb } from "../database"
import { settingSyncQueue } from "../modules/settings/sync-queue"
import { initAnalytics } from "./analytics"
import { initializeAppCheck } from "./app-check"
import { initBackgroundFetch } from "./background"
import { initCrashlytics } from "./crashlytics"
import { initializeDayjs } from "./dayjs"
import { hydrateDatabaseToStore, hydrateQueryClient, hydrateSettings } from "./hydrate"
import { migrateDatabase } from "./migration"
import { initializePlayer } from "./player"

/* eslint-disable no-console */
export const initializeApp = async () => {
  console.log(`Initialize...`)

  const now = Date.now()
  initializeDb()

  await apm("migrateDatabase", migrateDatabase)
  initializeDayjs()

  await apm("hydrateSettings", hydrateSettings)
  let dataHydratedTime = Date.now()
  await apm("hydrateDatabaseToStore", hydrateDatabaseToStore)

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
  initBackgroundFetch()
  console.log(`Initialize done,`, `${loadingTime}ms`)
}

const apm = async (label: string, fn: () => Promise<any> | any) => {
  const start = Date.now()
  const result = await fn()
  const end = Date.now()
  console.log(`${label} took ${end - start}ms`)
  return result
}
