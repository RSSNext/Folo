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
