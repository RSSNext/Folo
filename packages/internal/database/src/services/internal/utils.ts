import { sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm/sql"
import type { SQLiteTable } from "drizzle-orm/sqlite-core"
import { getTableColumns } from "drizzle-orm/utils"

export function conflictUpdateAllExcept<
  T extends SQLiteTable,
  E extends (keyof T["$inferInsert"])[],
>(table: T, except: E) {
  const columns = getTableColumns(table)
  const updateColumns = Object.entries(columns).filter(
    ([col]) => !except.includes(col as keyof typeof table.$inferInsert),
  )

  return Object.fromEntries(
    updateColumns.map(([colName, table]) => [colName, sql.raw(`excluded.${table.name}`)]),
  ) as Omit<Record<keyof typeof table.$inferInsert, SQL>, E[number]>
}
