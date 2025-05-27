import { migrateDb } from "@follow/database/db"
import { useSyncExternalStore } from "react"

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
    await migrateDb()
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
