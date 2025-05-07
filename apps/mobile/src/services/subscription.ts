import type { FeedViewType } from "@follow/constants/src/enums"
import { and, eq, inArray, notInArray, sql } from "drizzle-orm"

import { db } from "../database"
import { feedsTable, inboxesTable, listsTable, subscriptionsTable } from "../database/schemas"
import type { SubscriptionSchema } from "../database/schemas/types"
import { dbStoreMorph } from "../morph/db-store"
import { subscriptionActions } from "../store/subscription/store"
import type { Hydratable, Resetable } from "./internal/base"

class SubscriptionServiceStatic implements Hydratable, Resetable {
  async reset() {
    await db.delete(subscriptionsTable).execute()
  }
  async upsertMany(subscriptions: SubscriptionSchema[]) {
    if (subscriptions.length === 0) return
    await db
      .insert(subscriptionsTable)
      .values(subscriptions)
      .onConflictDoUpdate({
        target: [subscriptionsTable.id],
        set: {
          category: sql`excluded.category`,
          createdAt: sql`excluded.created_at`,
          feedId: sql`excluded.feed_id`,
          isPrivate: sql`excluded.is_private`,
          title: sql`excluded.title`,
          userId: sql`excluded.user_id`,
          view: sql`excluded.view`,
        },
      })
  }

  async patch(subscription: Partial<SubscriptionSchema> & { id: string }) {
    await db
      .update(subscriptionsTable)
      .set(subscription)
      .where(eq(subscriptionsTable.id, subscription.id))
  }
  async hydrate() {
    const subscriptions = await db.query.subscriptionsTable.findMany()
    subscriptionActions.upsertManyInSession(
      subscriptions.map((s) => dbStoreMorph.toSubscriptionModel(s)),
    )
  }

  async deleteNotExists(existsIds: string[], view?: FeedViewType) {
    const notExistsIds = await db.query.subscriptionsTable.findMany({
      where: and(
        notInArray(subscriptionsTable.id, existsIds),
        typeof view === "number" ? eq(subscriptionsTable.view, view) : undefined,
      ),
      columns: {
        id: true,
      },
    })
    if (notExistsIds.length === 0) return

    this.delete(notExistsIds.map((s) => s.id))
  }

  async delete(id: string | string[]) {
    const ids = Array.isArray(id) ? id : [id]

    const results = await db.query.subscriptionsTable.findMany({
      where: inArray(subscriptionsTable.id, ids),
      columns: {
        feedId: true,
        listId: true,
        type: true,
        inboxId: true,
      },
    })

    await db.delete(subscriptionsTable).where(inArray(subscriptionsTable.id, ids)).execute()

    if (!results || results.length === 0) return

    // Cleanup
    for (const result of results) {
      const { type, feedId, listId, inboxId } = result
      switch (type) {
        case "feed": {
          if (!feedId) break
          await db.delete(feedsTable).where(eq(feedsTable.id, feedId)).execute()
          break
        }
        case "list": {
          if (!listId) break
          await db.delete(listsTable).where(eq(listsTable.id, listId)).execute()
          break
        }
        case "inbox": {
          if (!inboxId) break
          await db.delete(inboxesTable).where(eq(inboxesTable.id, inboxId)).execute()
          break
        }
      }
    }
  }
}
export const SubscriptionService = new SubscriptionServiceStatic()
