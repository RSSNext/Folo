import type { EntryModel } from "@follow/store/entry/types"
import type { FeedModel } from "@follow/store/feed/types"
import type { SubscriptionModel } from "@follow/store/subscription/types"

// @ts-expect-error
export interface SearchResult<T extends object, A extends object = object> extends A {
  item: T
}

export interface SearchState {
  feeds: SearchResult<FeedModel>[]
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
