import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import * as FileSystem from "expo-file-system"
import * as SQLite from "expo-sqlite"

import * as schema from "./schemas"

export const sqlite = SQLite.openDatabaseSync("follow.db")

let db: ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLite.SQLiteDatabase
}

export function initializeDb() {
  db = drizzle(sqlite, {
    schema,
    logger: false,
  })
}

export { db }
export const getDbPath = () => {
  return `${FileSystem.documentDirectory}SQLite/follow.db`
}
if (__DEV__) console.info("SQLite:", getDbPath())
