import { SQLITE_DB_NAME } from "@follow/database/constant"
import { File, Paths } from "expo-file-system"
import Storage from "expo-sqlite/kv-store"

const RESET_SCHEDULED_KEY = "localDataResetScheduled"

// SQLite keeps an open database's write-ahead log and shared memory next to it. A log left
// behind would be replayed into the next database of that name.
const DATABASE_FILE_NAMES = ["", "-wal", "-shm", "-journal"].map(
  (suffix) => `${SQLITE_DB_NAME}${suffix}`,
)

/**
 * Have the next launch delete the local database, before anything opens it. Deleting it from
 * under the running app would fail every write still under way until the app reloads: SQLite
 * refuses writes to a database file that was deleted while open.
 */
export const scheduleLocalDataReset = () => {
  Storage.setItemSync(RESET_SCHEDULED_KEY, "1")
}

/** Deletes the local database when a reset was scheduled. Runs before the database is opened. */
export const applyScheduledLocalDataReset = () => {
  if (Storage.getItemSync(RESET_SCHEDULED_KEY) !== "1") return

  try {
    for (const name of DATABASE_FILE_NAMES) {
      const file = new File(Paths.document, "SQLite", name)
      if (file.exists) file.delete()
    }
  } catch (error) {
    // The reset stays scheduled, so the next launch tries again
    console.error("[local-data-reset] failed to delete the local database", error)
    return
  }
  Storage.removeItemSync(RESET_SCHEDULED_KEY)
}
