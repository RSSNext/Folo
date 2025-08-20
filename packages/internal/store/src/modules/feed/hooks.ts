import { jotaiStore } from "@follow/utils/jotai"
import { isBizId } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useCallback, useMemo } from "react"

import { FEED_COLLECTION_LIST, ROUTE_FEED_PENDING } from "../../constants/app"
import type { GeneralQueryOptions } from "../../types"
import { feedSyncServices, useFeedStore } from "./store"
import type { FeedModel } from "./types"

const defaultSelector = (feed: FeedModel) => feed
export function useFeedById(id: string | undefined | null): FeedModel | undefined
export function useFeedById<T>(
  id: string | undefined | null,
  selector: (feed: FeedModel) => T,
): T | undefined
export function useFeedById<T>(
  id: string | undefined | null,
  // @ts-expect-error
  selector: (feed: FeedModel) => T = defaultSelector,
): T | undefined {
  return useFeedStore(
    useCallback(
      (state) => {
        if (!id) return
        const feed = state.feeds[id]
        if (!feed) return
        return selector(feed)
      },
      [id],
    ),
  )
}

export function useFeedByUrl(url: string | undefined | null): FeedModel | undefined {
  return useFeedStore(
    useCallback(
      (state) => {
        if (!url) return
        const feed = Object.values(state.feeds).find((feed) => feed.url === url)
        if (!feed) return
        return feed
      },
      [url],
    ),
  )
}

export function useFeedByIdOrUrl(params: { id?: string; url?: string }): FeedModel | undefined {
  const { id, url } = params
  const feedById = useFeedById(id)
  const feedByUrl = useFeedByUrl(url)
  return feedById || feedByUrl
}

export const usePrefetchFeed = (id: string | undefined, options?: GeneralQueryOptions) => {
  return useQuery({
    ...options,
    queryKey: ["feed", id],
    queryFn: () => feedSyncServices.fetchFeedById({ id }),
  })
}

export const usePrefetchFeedByUrl = (url: string, options?: GeneralQueryOptions) => {
  return useQuery({
    ...options,
    queryKey: ["feed", url],
    queryFn: () => feedSyncServices.fetchFeedByUrl({ url }),
  })
}

export const usePrefetchFeedAnalytics = (id: string | string[], options?: GeneralQueryOptions) => {
  return useQuery({
    ...options,
    queryKey: ["feed", "analytics", id],
    queryFn: () => feedSyncServices.fetchAnalytics(id),
  })
}

const feedUnreadDirtySetAtom = atom(new Set<string>())

// 1. feedId may be feedId, or `inbox-id` or `feedId, feedId,` or `list-id`, or `all`, or `collections`
export const useFeedUnreadIsDirty = (feedId: string) => {
  return useAtomValue(
    useMemo(
      () =>
        selectAtom(feedUnreadDirtySetAtom, (set) => {
          const isRealFeedId = isBizId(feedId)

          if (isRealFeedId) return set.has(feedId)

          if (feedId === ROUTE_FEED_PENDING) {
            return set.size > 0
          }

          if (feedId === FEED_COLLECTION_LIST) {
            // Entry in collections has not unread status
            return false
          }

          const splitted = feedId.split(",")
          let isDirty = false
          for (const feedId of splitted) {
            if (isBizId(feedId)) {
              isDirty = isDirty || set.has(feedId)

              if (isDirty) break
            }
          }
          return isDirty
        }),
      [feedId],
    ),
  )
}

export const setFeedUnreadDirty = (feedId: string) => {
  jotaiStore.set(feedUnreadDirtySetAtom, (prev) => {
    const newSet = new Set(prev)
    newSet.add(feedId)
    return newSet
  })
}

export const clearFeedUnreadDirty = (feedId: string) => {
  jotaiStore.set(feedUnreadDirtySetAtom, (prev) => {
    const newSet = new Set(prev)
    newSet.delete(feedId)
    return newSet
  })
}

export const clearAllFeedUnreadDirty = () => {
  jotaiStore.set(feedUnreadDirtySetAtom, new Set())
}
