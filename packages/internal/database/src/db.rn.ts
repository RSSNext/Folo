import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { migrate } from "drizzle-orm/expo-sqlite/migrator"
import * as FileSystem from "expo-file-system"
import * as SQLite from "expo-sqlite"

import { SQLITE_DB_NAME } from "./constant"
import migrations from "./drizzle/migrations"
import * as schema from "./schemas"

export const sqlite = SQLite.openDatabaseSync(SQLITE_DB_NAME)

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

export async function migrateDb(): Promise<void> {
  try {
    await migrate(db, migrations)
  } catch (error) {
    console.error("Failed to migrate database:", error)
    const dbPath = `${FileSystem.documentDirectory}SQLite/${SQLITE_DB_NAME}`
    await FileSystem.deleteAsync(dbPath)
    await migrate(db, migrations)
  }
}
