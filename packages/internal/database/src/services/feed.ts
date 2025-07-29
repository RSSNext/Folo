import { eq } from "drizzle-orm"

import { db } from "../db"
import { feedsTable } from "../schemas"
import type { FeedSchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

export const FEED_EXTRA_DATA_KEYS = [
  "subscriptionCount",
  "updatesPerWeek",
  "latestEntryPublishedAt",
] as const

class FeedServiceStatic implements Resetable {
  async reset() {
    await db.delete(feedsTable).execute()
  }
  async upsertMany(feed: FeedSchema[]) {
    if (feed.length === 0) return
    await db
      .insert(feedsTable)
      .values(feed)
      .onConflictDoUpdate({
        target: [feedsTable.id],
        set: conflictUpdateAllExcept(feedsTable, ["id", ...FEED_EXTRA_DATA_KEYS]),
      })
  }

  getFeedAll() {
    return db.query.feedsTable.findMany()
  }

  async patch(feedId: string, patch: Partial<FeedSchema>) {
    await db.update(feedsTable).set(patch).where(eq(feedsTable.id, feedId)).execute()
  }
}

export const FeedService = new FeedServiceStatic()
