import { FeedViewType } from "@follow/constants"

import { FEED_COLLECTION_LIST, ROUTE_FEED_PENDING } from "../../constants/app"
import type { EntrySortOrder, UseEntriesReturn } from "./types"

export function isTimelineEntriesSource({
  feedId,
  inboxId,
  isCollection,
}: {
  feedId?: string
  inboxId?: string
  isCollection?: boolean
}) {
  return !inboxId && isCollection !== true && feedId !== FEED_COLLECTION_LIST
}

export function getEffectiveEntrySortOrder({
  sortOrder,
  unreadOnly,
  isTimelineSource,
}: {
  sortOrder?: EntrySortOrder
  unreadOnly: boolean
  isTimelineSource: boolean
}): EntrySortOrder {
  return unreadOnly && isTimelineSource ? (sortOrder ?? "desc") : "desc"
}

export function getMarkReadTimeRange({
  publishedAt,
  position,
  sortOrder,
}: {
  publishedAt: Date | string
  position: "above" | "below"
  sortOrder: EntrySortOrder
}) {
  const publishedAtTime = new Date(publishedAt).getTime()
  const targetsOlderEntries =
    (position === "above" && sortOrder === "asc") || (position === "below" && sortOrder === "desc")

  return targetsOlderEntries
    ? {
        startTime: 1,
        endTime: publishedAtTime - 1,
      }
    : {
        startTime: publishedAtTime + 1,
        endTime: Date.now(),
      }
}

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
  refetch: async () => {},

  fetchNextPage: async () => {},

  isLoading: true,
  isReady: false,
  isFetching: false,
  isRefetching: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  hasNextPage: false,
  error: null,
}

interface EntriesPageLike {
  data?: Array<{ entries: { id: string } }> | null
}

interface LoadedEntriesPages<TPage, TParam> {
  pages: TPage[]
  pageParams: TParam[]
}

const getPageEntryIds = (page: EntriesPageLike) =>
  (page.data ?? []).map((item) => item.entries.id).filter((id) => typeof id === "string")

/**
 * Put a freshly fetched first page in front of the pages that are already loaded.
 *
 * The fresh page is authoritative for the range it covers, so everything loaded up to the
 * deepest entry both sides share is replaced by it and the rest is kept. Without a shared
 * entry there may be a gap between the two, and only the fresh page is kept: the user loads
 * the rest by scrolling, exactly like after opening the list.
 */
export const mergeEntriesHead = <TPage extends EntriesPageLike, TParam>(
  current: LoadedEntriesPages<TPage, TParam> | undefined,
  head: TPage,
): LoadedEntriesPages<TPage, TParam> | undefined => {
  if (!current || current.pages.length === 0) return current

  const headIds = getPageEntryIds(head)
  const headIdSet = new Set(headIds)
  const loadedIds = current.pages.flatMap((page) => getPageEntryIds(page))

  let lastSharedIndex = -1
  loadedIds.forEach((id, index) => {
    if (headIdSet.has(id)) lastSharedIndex = index
  })

  const firstPageParam = current.pageParams[0] as TParam
  if (lastSharedIndex === -1) {
    return loadedIds.length === 0 && headIds.length === 0
      ? current
      : { pages: [head], pageParams: [firstPageParam] }
  }

  if (headIds.every((id, index) => loadedIds[index] === id)) {
    // Nothing new: keep the cached object so nothing re-renders.
    return current
  }

  const covered = new Set(loadedIds.slice(0, lastSharedIndex + 1))
  const pages: TPage[] = []
  const pageParams: TParam[] = []
  current.pages.forEach((page, index) => {
    const rest = (page.data ?? []).filter(
      (item) => !covered.has(item.entries.id) && !headIdSet.has(item.entries.id),
    )
    if (index === 0) {
      pages.push({ ...head, data: [...(head.data ?? []), ...rest] })
      pageParams.push(firstPageParam)
    } else if (rest.length > 0) {
      pages.push({ ...page, data: rest })
      pageParams.push(current.pageParams[index] as TParam)
    }
  })

  return { pages, pageParams }
}

/**
 * Drop the empty pages at the end of a list. An oldest-first list that was scrolled to its
 * end holds one: it is what told the list there was nothing more. Removing it lets the list
 * ask for the entries after its last one again, which is where new entries arrive.
 */
export const trimTrailingEmptyPages = <TPage extends EntriesPageLike, TParam>(
  current: LoadedEntriesPages<TPage, TParam> | undefined,
): LoadedEntriesPages<TPage, TParam> | undefined => {
  if (!current) return current
  let end = current.pages.length
  while (end > 1 && (current.pages[end - 1]!.data?.length ?? 0) === 0) {
    end -= 1
  }
  if (end === current.pages.length) return current
  return { pages: current.pages.slice(0, end), pageParams: current.pageParams.slice(0, end) }
}
