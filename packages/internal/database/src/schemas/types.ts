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

export type SubscriptionSchema = typeof subscriptionsTable.$inferInsert

export type FeedSchema = typeof feedsTable.$inferInsert

export type InboxSchema = typeof inboxesTable.$inferInsert

export type ListSchema = typeof listsTable.$inferInsert

export type UnreadSchema = typeof unreadTable.$inferInsert

export type UserSchema = typeof usersTable.$inferInsert

export type EntrySchema = typeof entriesTable.$inferInsert

export type CollectionSchema = typeof collectionsTable.$inferInsert

export type SummarySchema = typeof summariesTable.$inferInsert

export type TranslationSchema = typeof translationsTable.$inferInsert

export type ImageSchema = typeof imagesTable.$inferInsert

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

// export { ImageColorsResult } from "react-native-image-colors"

interface AndroidImageColors {
  dominant: string
  average: string
  vibrant: string
  darkVibrant: string
  lightVibrant: string
  darkMuted: string
  lightMuted: string
  muted: string
  platform: "android"
}

interface WebImageColors {
  dominant: string
  vibrant: string
  darkVibrant: string
  lightVibrant: string
  darkMuted: string
  lightMuted: string
  muted: string
  platform: "web"
}

interface IOSImageColors {
  background: string
  primary: string
  secondary: string
  detail: string
  platform: "ios"
}

export type ImageColorsResult = AndroidImageColors | IOSImageColors | WebImageColors
