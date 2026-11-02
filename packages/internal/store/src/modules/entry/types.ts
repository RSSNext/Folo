import type { FeedViewType } from "@follow/constants"
import type { EntrySchema } from "@follow/database/schemas/types"

export type EntryModel = EntrySchema
export type EntrySortOrder = "asc" | "desc"
export type FetchEntriesProps = {
  feedId?: string
  feedIdList?: string[]
  inboxId?: string
  listId?: string
  view?: number
  read?: boolean
  limit?: number
  pageParam?: string
  isCollection?: boolean
  excludePrivate?: boolean
  aiSort?: boolean
  sortOrder?: EntrySortOrder
}

export type FetchEntriesPropsSettings = {
  hidePrivateSubscriptionsInTimeline?: boolean
  unreadOnly?: boolean
  sortOrder?: EntrySortOrder
}

export type UseEntriesProps = {
  viewId?: FeedViewType
  active?: boolean
}

export type UseEntriesReturn = {
  entriesIds: string[]
  hasNext: boolean
  refetch: () => Promise<void>
  fetchNextPage: () => Promise<void> | void
  isLoading: boolean
  isRefetching: boolean
  isReady: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  /** The last next-page request failed, so the list can offer a retry instead of loading forever */
  isFetchNextPageError: boolean
  hasNextPage: boolean
  error: Error | null
  fetchedTime?: number
  queryKey?: (string | number | boolean | string[] | undefined)[]
}

export type UseEntriesControl = Pick<
  UseEntriesReturn,
  "fetchNextPage" | "isFetching" | "refetch" | "isRefetching" | "hasNextPage"
>
