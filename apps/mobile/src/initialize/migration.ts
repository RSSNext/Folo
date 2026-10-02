import { migrateDB } from "@follow/database/db"
import { useSyncExternalStore } from "react"

const listeners = new Set<() => void>()
const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)

  return () => {
    listeners.delete(onStoreChange)
  }
}
let migrateStore = {
  success: false,
  error: null as Error | null,
}

export const migrateDatabase = async () => {
  try {
    await migrateDB()
    migrateStore = { success: true, error: null }
  } catch (error) {
    migrateStore = { success: false, error: error as Error }

    console.error(error)
  }
  // useSyncExternalStore compares snapshots by identity. Mutating the previous
  // object leaves subscribers stuck on the migration screen during cold starts.
  listeners.forEach((listener) => listener())
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
