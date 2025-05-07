import { db } from "../database"
import { feedsTable } from "../database/schemas"
import type { FeedSchema } from "../database/schemas/types"
import { feedActions } from "../store/feed/store"
import type { Hydratable, Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class FeedServiceStatic implements Hydratable, Resetable {
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

  async hydrate() {
    const feeds = await db.query.feedsTable.findMany()
    feedActions.upsertManyInSession(feeds)
  }
}

export const FeedService = new FeedServiceStatic()
