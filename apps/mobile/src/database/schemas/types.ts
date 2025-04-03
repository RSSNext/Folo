import type { HonoApiClient } from "@/src/morph/types"

import type {
  collectionsTable,
  entriesTable,
  feedsTable,
  imagesTable,
  inboxesTable,
  listsTable,
  subscriptionsTable,
  summariesTable,
  translationsTable,
  unreadTable,
  usersTable,
} from "."

export type SubscriptionSchema = typeof subscriptionsTable.$inferSelect

export type FeedSchema = typeof feedsTable.$inferSelect

export type InboxSchema = typeof inboxesTable.$inferSelect

export type ListSchema = typeof listsTable.$inferSelect

export type UnreadSchema = typeof unreadTable.$inferSelect

export type UserSchema = typeof usersTable.$inferSelect

export type EntrySchema = typeof entriesTable.$inferSelect

export type CollectionSchema = typeof collectionsTable.$inferSelect

export type SummarySchema = typeof summariesTable.$inferSelect

export type TranslationSchema = typeof translationsTable.$inferSelect

export type ImageSchema = typeof imagesTable.$inferInsert

export type ActionSettings = HonoApiClient.ActionSettings

export type MediaModel = {
  url: string
  type: "photo" | "video"
  preview_image_url?: string
  width?: number
  height?: number
  blurhash?: string
}

export type AttachmentsModel = {
  url: string
  duration_in_seconds?: number | string
  mime_type?: string
  size_in_bytes?: number
  title?: string
}

export type ExtraModel = {
  links?: {
    url: string
    type: string
    content_html?: string
  }[]
}

export { ImageColorsResult } from "react-native-image-colors"
