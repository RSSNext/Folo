import type { FeedViewType } from "@follow/constants"
import type { SupportedActionLanguage } from "@follow/shared/language"
import type { EntrySettings } from "@follow-app/client-sdk"
import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import type { AttachmentsModel, ExtraModel, ImageColorsResult, MediaModel } from "./types"

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
  subscriptionCount: integer("subscription_count"),
  updatesPerWeek: integer("updates_per_week"),
  latestEntryPublishedAt: text("latest_entry_published_at"),
  tipUserIds: text("tip_users", { mode: "json" }).$type<string[]>(),
  updatedAt: integer("published_at", { mode: "timestamp_ms" }),
})

export const subscriptionsTable = sqliteTable("subscriptions", {
  feedId: text("feed_id"),
  listId: text("list_id"),
  inboxId: text("inbox_id"),
  userId: text("user_id").notNull(),
  view: integer("view").notNull().$type<FeedViewType>(),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull(),
  hideFromTimeline: integer("hide_from_timeline", { mode: "boolean" }),
  title: text("title"),
  category: text("category"),
  createdAt: text("created_at"),
  type: text("type").notNull().$type<"feed" | "list" | "inbox">(),
  id: text("id").primaryKey(),
})

export const inboxesTable = sqliteTable("inboxes", {
  id: text("id").primaryKey(),
  title: text("title"),
  secret: text("secret").notNull(),
})

export const listsTable = sqliteTable("lists", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  title: text("title").notNull(),
  feedIds: text("feed_ids", { mode: "json" }).$type<string>(),
  description: text("description"),
  view: integer("view").notNull().$type<FeedViewType>(),
  image: text("image"),
  fee: integer("fee"),
  ownerUserId: text("owner_user_id"),
  subscriptionCount: integer("subscription_count"),
  purchaseAmount: text("purchase_amount"),
})

export const unreadTable = sqliteTable("unread", {
  id: text("subscription_id").notNull().primaryKey(),
  count: integer("count").notNull(),
})

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  handle: text("handle"),
  name: text("name"),
  image: text("image"),
  isMe: integer("is_me", { mode: "boolean" }),
  emailVerified: integer("email_verified", { mode: "boolean" }),
  bio: text("bio"),
  website: text("website"),
  socialLinks: text("social_links", { mode: "json" }).$type<{
    twitter?: string
    github?: string
    instagram?: string
    facebook?: string
    youtube?: string
    discord?: string
  }>(),
})
export const entriesTable = sqliteTable("entries", {
  id: text("id").primaryKey(),
  title: text("title"),
  url: text("url"),
  content: text("content"),
  readabilityContent: text("source_content"),
  readabilityUpdatedAt: integer("readability_updated_at", { mode: "timestamp_ms" }),
  description: text("description"),
  guid: text("guid").notNull(),
  author: text("author"),
  authorUrl: text("author_url"),
  authorAvatar: text("author_avatar"),
  insertedAt: integer("inserted_at", { mode: "timestamp_ms" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }).notNull(),
  media: text("media", { mode: "json" }).$type<MediaModel[]>(),
  categories: text("categories", { mode: "json" }).$type<string[]>(),
  attachments: text("attachments", { mode: "json" }).$type<AttachmentsModel[]>(),
  extra: text("extra", { mode: "json" }).$type<ExtraModel>(),
  language: text("language"),

  feedId: text("feed_id"),

  inboxHandle: text("inbox_handle"),
  read: integer("read", { mode: "boolean" }),
  sources: text("sources", { mode: "json" }).$type<string[]>(),
  settings: text("settings", { mode: "json" }).$type<EntrySettings>(),
})

export const collectionsTable = sqliteTable("collections", {
  feedId: text("feed_id"),
  entryId: text("entry_id").notNull().primaryKey(),
  createdAt: text("created_at"),
  view: integer("view").notNull().$type<FeedViewType>(),
})

export const summariesTable = sqliteTable(
  "summaries",
  {
    entryId: text("entry_id").notNull(),
    summary: text("summary").notNull(),
    readabilitySummary: text("readability_summary"),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    language: text("language").$type<SupportedActionLanguage>(),
  },
  (t) => [uniqueIndex("unq").on(t.entryId, t.language)],
)

export const translationsTable = sqliteTable(
  "translations",
  (t) => ({
    entryId: t.text("entry_id").notNull(),
    language: t.text("language").$type<SupportedActionLanguage>().notNull(),
    title: t.text("title"),
    description: t.text("description"),
    content: t.text("content"),
    readabilityContent: t.text("readability_content"),
    createdAt: t
      .text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  }),
  (t) => [uniqueIndex("translation-unique-index").on(t.entryId, t.language)],
)

export const imagesTable = sqliteTable("images", (t) => ({
  url: t.text("url").notNull().primaryKey(),
  colors: t.text("colors", { mode: "json" }).$type<ImageColorsResult>().notNull(),
  createdAt: t
    .integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}))

// AI Chat Sessions Table
export const aiChatTable = sqliteTable(
  "ai_chat_sessions",
  (t) => ({
    chatId: t.text("id").notNull().primaryKey(),
    title: t.text("title"),
    createdAt: t
      .integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: t
      .integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  }),
  (table) => ({
    updatedAtIdx: index("idx_ai_chat_sessions_updated_at").on(table.updatedAt),
  }),
)

// Message Part types based on Vercel AI SDK UIMessage parts
interface TextUIPart {
  type: "text"
  text: string
}

interface ReasoningUIPart {
  type: "reasoning"
  reasoning: string
}

interface ToolInvocationUIPart {
  type: "tool-invocation"
  toolInvocation: {
    state: "partial-call" | "call" | "result"
    toolCallId: string
    toolName: string
    args: any
    result?: any
  }
}

interface SourceUIPart {
  type: "source"
  source: {
    sourceType: "url"
    id: string
    url: string
    title?: string
  }
}

interface StepStartUIPart {
  type: "step-start"
}

type UIMessagePart =
  | TextUIPart
  | ReasoningUIPart
  | ToolInvocationUIPart
  | SourceUIPart
  | StepStartUIPart

// AI Chat Messages Table - Rich text support
export const aiChatMessagesTable = sqliteTable(
  "ai_chat_messages",
  (t) => ({
    id: t.text("id").notNull().primaryKey(),
    chatId: t
      .text("chat_id")
      .notNull()
      .references(() => aiChatTable.chatId, { onDelete: "cascade" }),

    // Core message properties matching Vercel AI SDK UIMessage
    role: t.text("role").notNull().$type<"user" | "assistant" | "system">(),

    richTextSchema: t
      .text("rich_text_schema", { mode: "json" })
      .$type<import("lexical").SerializedEditorState>(), // Lexical schema for user rich text

    // Vercel AI SDK UIMessage properties
    createdAt: t.integer("created_at", { mode: "timestamp_ms" }),
    metadata: t.text("metadata", { mode: "json" }).$type<any>(),

    // Message processing status
    status: t
      .text("status")
      .$type<"pending" | "streaming" | "completed" | "error">()
      .default("completed"),
    finishedAt: t.integer("finished_at", { mode: "timestamp_ms" }),

    // Store UIMessage parts for complex assistant responses (tools, reasoning, etc)
    messageParts: t.text("message_parts", { mode: "json" }).$type<UIMessagePart[]>(),
  }),
  (table) => ({
    chatIdCreatedAtIdx: index("idx_ai_chat_messages_chat_id_created_at").on(
      table.chatId,
      table.createdAt,
    ),
    statusIdx: index("idx_ai_chat_messages_status").on(table.status),
    chatIdRoleIdx: index("idx_ai_chat_messages_chat_id_role").on(table.chatId, table.role),
  }),
)
