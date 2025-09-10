import type { FeedViewType } from "@follow/constants"

export * from "@follow/models/rsshub"

export type ParsedFeedItem = {
  url: string
  title: string | null
  category?: string | null
}
