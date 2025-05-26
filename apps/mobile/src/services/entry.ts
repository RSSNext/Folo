import { db } from "@follow/database/src/db"
import { entriesTable } from "@follow/database/src/schemas"
import type { EntrySchema } from "@follow/database/src/schemas/types"
import { and, between, eq, inArray, or } from "drizzle-orm"

import type { PublishAtTimeRangeFilter } from "../store/unread/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class EntryServiceStatic implements Resetable {
  async reset() {
    await db.delete(entriesTable).execute()
  }

  async upsertMany(entries: EntrySchema[]) {
    if (entries.length === 0) return
    await db
      .insert(entriesTable)
      .values(entries)
      .onConflictDoUpdate({
        target: [entriesTable.id],
        set: conflictUpdateAllExcept(entriesTable, ["id"]),
      })
  }

  async patch(entry: Partial<EntrySchema> & { id: string }) {
    await db.update(entriesTable).set(entry).where(eq(entriesTable.id, entry.id))
  }

  async patchMany({
    entry,
    entryIds,
    feedIds,
    time,
  }: {
    entry: Partial<EntrySchema>
    entryIds?: string[]
    feedIds?: string[]
    time?: PublishAtTimeRangeFilter
  }) {
    if (!entryIds && !feedIds) return
    await db
      .update(entriesTable)
      .set(entry)
      .where(
        and(
          or(inArray(entriesTable.id, entryIds ?? []), inArray(entriesTable.feedId, feedIds ?? [])),
          time
            ? between(entriesTable.publishedAt, new Date(time.startTime), new Date(time.endTime))
            : undefined,
        ),
      )
  }

  getEntryMany(entryId: string[]) {
    return db.query.entriesTable.findMany({ where: inArray(entriesTable.id, entryId) })
  }

  getEntryAll() {
    return db.query.entriesTable.findMany()
  }
}

export const EntryService = new EntryServiceStatic()
