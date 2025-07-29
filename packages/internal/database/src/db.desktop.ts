import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"
import { drizzle } from "drizzle-orm/sqlite-proxy"
// @ts-expect-error
import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs"
// @ts-expect-error
import { IDBMirrorVFS as MyVFS } from "wa-sqlite/src/examples/IDBMirrorVFS.js"
// @ts-expect-error
import * as SQLite from "wa-sqlite/src/sqlite-api.js"

import { SQLITE_DB_NAME } from "./constant"
import { DatabaseSource } from "./DatabaseSource"
import migrations from "./drizzle/migrations"
import { migrate } from "./migrator"
import { resourceLock } from "./ResourceLock"
import * as schema from "./schemas"

let db: SqliteRemoteDatabase<typeof schema>

const IDB_NAME = "WA_SQLITE"

export async function initializeDB() {
  const module = await SQLiteESMFactory()
  const sqlite3 = SQLite.Factory(module)
  const vfs = await MyVFS.create(IDB_NAME, module)
  sqlite3.vfs_register(vfs, true)
  const dbSqlite3 = await sqlite3.open_v2(SQLITE_DB_NAME)

  db = drizzle(
    async (sql, params, method) => {
      let releaseLock: (() => void) | undefined
      const query = async function (db: any, sql: any) {
        releaseLock = await resourceLock.acquire()
        const rows: any[] = []

        for await (const stmt of sqlite3.statements(db, sql)) {
          if (Array.isArray(params) && params.length > 0) {
            sqlite3.bind_collection(stmt, params)
          }

          while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(stmt)
            rows.push(row)
          }
        }

        return rows
      }

      try {
        const rows = await query(dbSqlite3, sql)
        if (method === "get") {
          return { rows: rows[0] || [] }
        } else {
          return { rows }
        }
      } catch (error) {
        console.error(`Error executing SQL: ${sql} with params:${params}`, error)
        return { rows: [] }
      } finally {
        releaseLock && releaseLock()
      }
    },
    {
      schema,
      logger: false,
    },
  )
}
export { db }

export async function migrateDB() {
  try {
    await migrate(db, migrations)
  } catch (error) {
    console.error("Failed to migrate database:", error)

    await deleteDB()
    await migrate(db, migrations)
  }
}

export async function exportDB() {
  const module = await SQLiteESMFactory()
  const vfs = await MyVFS.create(IDB_NAME, module)
  const source = new DatabaseSource(vfs, SQLITE_DB_NAME)
  source.isDone.finally(() => {
    vfs.close()
  })
  const response = new Response(new ReadableStream(source), {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="${SQLITE_DB_NAME}"`,
    },
  })
  const databaseFile = await response.blob()

  const fileUrl = URL.createObjectURL(databaseFile)

  const a = document.createElement("a")
  a.href = fileUrl
  a.download = SQLITE_DB_NAME
  a.click()
  a.remove()

  URL.revokeObjectURL(fileUrl)
}

export async function deleteDB() {
  indexedDB.deleteDatabase(IDB_NAME)
}
