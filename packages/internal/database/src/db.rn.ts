import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { migrate } from "drizzle-orm/expo-sqlite/migrator"
import * as SQLite from "expo-sqlite"

import { SQLITE_DB_NAME } from "./constant"
import migrations from "./drizzle/migrations"
import * as schema from "./schemas"

export let sqlite = SQLite.openDatabaseSync(SQLITE_DB_NAME)

let db: ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLite.SQLiteDatabase
}

export function initializeDB() {
  db = drizzle(sqlite, {
    schema,
    logger: false,
  })
}
export { db }

export async function migrateDB(): Promise<void> {
  try {
    await migrate(db, migrations)
  } catch (error) {
    console.error("Failed to migrate database:", error)
    await deleteDB()
    sqlite = SQLite.openDatabaseSync(SQLITE_DB_NAME)
    initializeDB()
    await migrate(db, migrations)
  }
}

export async function exportDB() {}
export async function deleteDB() {
  try {
    await sqlite.closeAsync()
  } catch {
    /* empty */
  }
  await SQLite.deleteDatabaseAsync(SQLITE_DB_NAME)
}
