import { and, between, eq, inArray, lt, or } from "drizzle-orm"

import { db } from "../db"
import { entriesTable } from "../schemas"
import type { EntrySchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

interface PublishAtTimeRangeFilter {
  startTime: number
  endTime: number
}

interface InsertedBeforeTimeRangeFilter {
  insertedBefore: number
}

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
    time?: PublishAtTimeRangeFilter | InsertedBeforeTimeRangeFilter
  }) {
    if (!entryIds && !feedIds) return
    await db
      .update(entriesTable)
      .set(entry)
      .where(
        and(
          or(inArray(entriesTable.id, entryIds ?? []), inArray(entriesTable.feedId, feedIds ?? [])),
          time && "startTime" in time
            ? between(entriesTable.publishedAt, new Date(time.startTime), new Date(time.endTime))
            : undefined,
          time && "insertedBefore" in time
            ? lt(entriesTable.insertedAt, new Date(time.insertedBefore))
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

  async getEntriesToHydrate() {
    const [entries, subscriptions] = await Promise.all([
      db.query.entriesTable.findMany({
        orderBy: (t, { desc }) => desc(t.publishedAt),
      }),
      db.query.subscriptionsTable.findMany(),
    ])

    const entryIdCountMap = new Map<string, number>(
      subscriptions.map((s) => [s.listId || s.inboxId || s.feedId || "", 0] as const),
    )

    const result: typeof entries = []
    const idsToClear = new Set<string>()

    for (const entry of entries) {
      const possibleIdList = [
        ...(entry.sources?.filter((s) => s !== "feed") ?? []),
        entry.inboxHandle,
        entry.feedId,
      ].filter(Boolean) as string[]

      if (possibleIdList.length === 0) continue

      for (const id of possibleIdList) {
        const count = entryIdCountMap.get(id)
        if (count === undefined) continue

        if (count >= 20) {
          idsToClear.add(entry.id)
        } else {
          result.push(entry)
          entryIdCountMap.set(id, count + 1)
        }
      }
    }

    await db
      .delete(entriesTable)
      .where(inArray(entriesTable.id, Array.from(idsToClear)))
      .execute()

    return result
  }

  async deleteMany(entryIds: string[]) {
    if (entryIds.length === 0) return
    await db.delete(entriesTable).where(inArray(entriesTable.id, entryIds))
  }
}

export const EntryService = new EntryServiceStatic()
