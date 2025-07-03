import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import { SQLocalDrizzle } from "sqlocal/drizzle"

import { SQLITE_DB_NAME } from "./constant"
import migrations from "./drizzle/migrations"
import { migrate } from "./migrator"
import * as schema from "./schemas"

declare const globalThis: {
  electron?: any
}

const isElectron = !!globalThis["electron"]
const isDev = process.env.NODE_ENV === "development"
const dbName = isDev && !isElectron ? ":localStorage:" : SQLITE_DB_NAME
// eslint-disable-next-line no-console
console.log("Using database:", dbName)

export const sqlite = new SQLocalDrizzle(dbName)

let db: SqliteRemoteDatabase<typeof schema>

export function initializeDB() {
  db = drizzle(sqlite.driver, sqlite.batchDriver, {
    schema,
    logger: false,
  })
}
export { db }

export async function migrateDB() {
  try {
    await migrate(db, migrations)
  } catch (error) {
    console.error("Failed to migrate database:", error)

    await sqlite.deleteDatabaseFile()
    await migrate(db, migrations)
  }
}

export async function exportDB() {
  const databaseFile = await sqlite.getDatabaseFile()
  const fileUrl = URL.createObjectURL(databaseFile)

  const a = document.createElement("a")
  a.href = fileUrl
  a.download = SQLITE_DB_NAME
  a.click()
  a.remove()

  URL.revokeObjectURL(fileUrl)
}
