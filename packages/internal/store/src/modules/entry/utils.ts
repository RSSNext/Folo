import { FeedViewType } from "@follow/constants"

import { FEED_COLLECTION_LIST, ROUTE_FEED_PENDING } from "../../constants/app"
import type { UseEntriesReturn } from "./types"

export function getEntriesParams({
  feedId,
  inboxId,
  listId,
  view,
  feedIdList,
}: {
  feedId?: number | string
  inboxId?: number | string
  listId?: number | string
  view?: number
  feedIdList?: string[]
}) {
  const params: {
    feedId?: string
    feedIdList?: string[]
    isCollection?: boolean
    withContent?: boolean
    inboxId?: string
    listId?: string
  } = {}
  if (inboxId) {
    params.inboxId = `${inboxId}`
  } else if (listId) {
    params.listId = `${listId}`
  } else if (feedIdList) {
    params.feedIdList = feedIdList
  } else if (feedId) {
    if (feedId === FEED_COLLECTION_LIST) {
      params.isCollection = true
    } else if (feedId !== ROUTE_FEED_PENDING) {
      if (feedId.toString().includes(",")) {
        params.feedIdList = `${feedId}`.split(",")
      } else {
        params.feedId = `${feedId}`
      }
    }
  }
  if (view === FeedViewType.SocialMedia) {
    params.withContent = true
  }
  return {
    view,
    ...params,
  }
}

export function getInboxFrom(entry?: { inboxHandle?: string | null; authorUrl?: string | null }) {
  if (isInboxEntry(entry)) {
    return entry?.authorUrl?.replace("mailto:", "")
  }
}

export function isInboxEntry(entry?: { inboxHandle?: string | null }) {
  return !!entry?.inboxHandle
}

export const fallbackReturn: UseEntriesReturn = {
  entriesIds: [],
  hasNext: false,
  hasUpdate: false,
  refetch: async () => {},

  fetchNextPage: async () => {},

  isLoading: true,
  isReady: false,
  isFetching: false,
  isRefetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  error: null,
}
