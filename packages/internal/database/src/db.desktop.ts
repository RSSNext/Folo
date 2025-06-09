import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import { SQLocalDrizzle } from "sqlocal/drizzle"

import { SQLITE_DB_NAME } from "./constant"
import migrations from "./drizzle/migrations"
import { migrate } from "./migrator"
import * as schema from "./schemas"

export const sqlite = new SQLocalDrizzle(SQLITE_DB_NAME)

let db: SqliteRemoteDatabase<typeof schema>

export function initializeDb() {
  db = drizzle(sqlite.driver, sqlite.batchDriver, {
    schema,
    logger: false,
  })
}
export { db }

export async function migrateDb() {
  try {
    await migrate(db, migrations)
  } catch (error) {
    console.error("Failed to migrate database:", error)

    await sqlite.deleteDatabaseFile()
    await migrate(db, migrations)
  }
}
