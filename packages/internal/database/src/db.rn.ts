import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { migrate } from "drizzle-orm/expo-sqlite/migrator"
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

export function migrateDb(): Promise<void> {
  return migrate(db, migrations)
}
