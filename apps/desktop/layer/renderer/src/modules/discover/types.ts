import type { FeedViewType } from "@follow/constants"

export * from "@follow/models/rsshub"

export type ParsedFeedItem = {
  url: string
  title: string | null
  category?: string | null
}

export type ParsedOpmlData = {
  remaining: number
  subscriptions: {
    category: string | null
    title: string
    url: string
    view: FeedViewType
  }[]
}
