import type { FeedViewType } from "@follow/constants"

export interface PublishAtTimeRangeFilter {
  startTime: number
  endTime: number
}

export interface InsertedBeforeTimeRangeFilter {
  insertedBefore: number
}

export interface UnreadUpdateOptions {
  reset?: boolean
}

export type FeedIdOrInboxHandle = string
export type UnreadStoreModel = Record<FeedIdOrInboxHandle, number>
export interface UnreadState {
  data: UnreadStoreModel
}

/** What an entry list shows, in the terms the unread counters are kept in. */
export interface UnreadListScope {
  view?: FeedViewType
  /** A feed id, or several joined with commas for a folder. */
  feedId?: string
  feedIdList?: string[]
  listId?: string
  inboxId?: string
  isCollection?: boolean
  /** Private subscriptions are hidden from the timeline, so their counters are left out. */
  excludePrivate?: boolean
}
