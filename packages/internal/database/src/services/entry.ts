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

const ENTRIES_KEPT_PER_SOURCE = 20
// Below SQLite's oldest default limit of 999 bound variables
const SQL_VARIABLES_PER_QUERY = 500

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
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

  /**
   * Keep the newest entries of every subscription and clear the rest, including the entries of
   * feeds that are no longer followed, such as previewed feeds or opened links.
   */
  async getEntriesToHydrate() {
    const [candidates, subscriptions] = await Promise.all([
      // Only what decides which entries to keep, so the content of the cleared ones isn't read
      db.query.entriesTable.findMany({
        columns: { id: true, feedId: true, inboxHandle: true, sources: true },
        orderBy: (t, { desc }) => desc(t.publishedAt),
      }),
      db.query.subscriptionsTable.findMany(),
    ])

    const entryIdCountMap = new Map<string, number>(
      subscriptions.map((s) => [s.listId || s.inboxId || s.feedId || "", 0] as const),
    )

    const idsToKeep: string[] = []
    const idsToClear: string[] = []

    for (const entry of candidates) {
      const possibleIdList = [
        ...(entry.sources?.filter((s) => s !== "feed") ?? []),
        entry.inboxHandle,
        entry.feedId,
      ].filter(Boolean) as string[]

      // An entry kept for one of its sources is kept even when another source is full
      let isKept = false
      for (const id of possibleIdList) {
        const count = entryIdCountMap.get(id)
        if (count === undefined || count >= ENTRIES_KEPT_PER_SOURCE) continue
        entryIdCountMap.set(id, count + 1)
        isKept = true
      }

      if (isKept) {
        idsToKeep.push(entry.id)
      } else {
        idsToClear.push(entry.id)
      }
    }

    for (const ids of chunk(idsToClear, SQL_VARIABLES_PER_QUERY)) {
      await db.delete(entriesTable).where(inArray(entriesTable.id, ids)).execute()
    }

    const order = new Map(idsToKeep.map((id, index) => [id, index]))
    const result: EntrySchema[] = []
    for (const ids of chunk(idsToKeep, SQL_VARIABLES_PER_QUERY)) {
      result.push(
        ...(await db.query.entriesTable.findMany({ where: inArray(entriesTable.id, ids) })),
      )
    }
    // Newest first, as they were selected
    return result.sort((a, b) => order.get(a.id)! - order.get(b.id)!)
  }

  async deleteMany(entryIds: string[]) {
    if (entryIds.length === 0) return
    await db.delete(entriesTable).where(inArray(entriesTable.id, entryIds))
  }
}

export const EntryService = new EntryServiceStatic()
