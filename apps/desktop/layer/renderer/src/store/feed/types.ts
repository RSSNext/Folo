import type { FeedModel } from "@follow/models/types"

type FeedId = string

export interface FeedState {
  feeds: Record<FeedId, FeedModel>
}
export type FeedQueryParams = { id?: string; url?: string }
