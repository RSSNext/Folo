import { browserDB } from "./db"

export * from "./db"
export * from "./schemas"

export const DB_NOT_READY_OR_DISABLED = "Database is not ready or disabled"
/**
 * @description Check if database is ready
 * If users disabled data persist, it's always false, that means you can't do operation with database.
 *
 */

export const runTransactionInScope = <T>(
  fn: (db: typeof browserDB) => T,
): T | typeof DB_NOT_READY_OR_DISABLED => {
  if (!window.__dbIsReady) {
    // Or, push to waiting queue
    return DB_NOT_READY_OR_DISABLED
  }

  return fn(browserDB)
}
