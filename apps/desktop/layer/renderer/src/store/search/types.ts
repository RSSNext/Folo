import type { EntryModel, FeedOrListRespModel } from "@follow/models/types"
import type { SubscriptionModel } from "@follow/store/subscription/types"

// @ts-expect-error
export interface SearchResult<T extends object, A extends object = object> extends A {
  item: T
}

export interface SearchState {
  feeds: SearchResult<FeedOrListRespModel>[]
  entries: SearchResult<EntryModel, { feedId: string }>[]
  subscriptions: SearchResult<SubscriptionModel, { feedId: string }>[]

  keyword: string
}
export interface SearchInstance {
  search: (keyword: string) => SearchState

  counts: {
    feeds: number
    entries: number
    subscriptions: number
  }
}
