import type { FeedModel } from "@follow/models/types"

export type DB_FeedUnread = {
  id: string
  count: number
}

export type DB_Feed = FeedModel & { id: string }
