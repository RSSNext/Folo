import type { FeedViewType } from "@follow/constants"
import { sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const feedsTable = sqliteTable("feeds", {
  id: text("id").primaryKey(),
  title: text("title"),
  url: text("url").notNull(),
  description: text("description"),
  image: text("image"),
  errorAt: text("error_at"),
  siteUrl: text("site_url"),
  ownerUserId: text("owner_user_id"),
  errorMessage: text("error_message"),
})

export const subscriptionsTable = sqliteTable(
  "subscriptions",
  {
    feedId: text("feed_id"),
    listId: text("list_id"),
    inboxId: text("inbox_id"),
    userId: text("user_id").notNull(),
    view: integer("view").notNull().$type<FeedViewType>(),
    isPrivate: integer("is_private").notNull(),
    title: text("title"),
    category: text("category"),
    createdAt: text("created_at"),
    type: text("type").notNull().$type<"feed" | "list" | "inbox">(),
  },
  (table) => ({
    pk: primaryKey({
      // @ts-expect-error
      columns: [table.userId, sql`coalesce(${table.feedId}, ${table.listId}, ${table.inboxId})`],
    }),
  }),
)

export const inboxesTable = sqliteTable("inboxes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title"),
})

export const listsTable = sqliteTable("lists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  feedIds: text("feed_ids", { mode: "json" }).$type<string>(),
  description: text("description"),
  view: integer("view").notNull().$type<FeedViewType>(),
  image: text("image"),
  fee: integer("fee"),
  ownerUserId: text("owner_user_id"),
})
