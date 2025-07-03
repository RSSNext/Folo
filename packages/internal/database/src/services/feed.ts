import { db } from "../db"
import { feedsTable } from "../schemas"
import type { FeedSchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

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
        set: conflictUpdateAllExcept(feedsTable, ["id"]),
      })
  }

  getFeedAll() {
    return db.query.feedsTable.findMany()
  }
}

export const FeedService = new FeedServiceStatic()
