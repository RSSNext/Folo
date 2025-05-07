import type { ListModel } from "@follow/models/types"

type FeedId = string

export interface ListState {
  lists: Record<FeedId, ListModel>
}
