import { migrate } from "drizzle-orm/expo-sqlite/migrator"
import { useSyncExternalStore } from "react"

import migrations from "@/drizzle/migrations"

import { db } from "../database"

let storeChangeFn: () => void
const subscribe = (onStoreChange: () => void) => {
  storeChangeFn = onStoreChange

  return () => {
    storeChangeFn = () => {}
  }
}
const migrateStore = {
  success: false,
  error: null as Error | null,
}

export const migrateDatabase = async () => {
  try {
    await migrate(db, migrations)
    migrateStore.success = true
    storeChangeFn?.()
  } catch (error) {
    migrateStore.error = error as Error

    console.error(error)

    storeChangeFn?.()
  }
}

const getSnapshot = () => {
  return migrateStore
}
const getServerSnapshot = () => {
  return migrateStore
}
export const useDatabaseMigration = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
