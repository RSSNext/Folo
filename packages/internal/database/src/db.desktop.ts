import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import { SQLocalDrizzle } from "sqlocal/drizzle"

import { SQLITE_DB_NAME } from "./constant"
// @ts-expect-error
import migrations from "./drizzle/migrations"
import { migrate } from "./migrator"
import * as schema from "./schemas"

const sqlite = new SQLocalDrizzle(SQLITE_DB_NAME)

let db: SqliteRemoteDatabase<typeof schema>

export function initializeDb() {
  db = drizzle(sqlite.driver, sqlite.batchDriver, {
    schema,
    logger: false,
  })
}

export function migrateDb() {
  return migrate(db, migrations)
}
