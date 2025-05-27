import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { feedSyncServices, useFeedStore } from "./store"
import type { FeedModel } from "./types"

const defaultSelector = (feed: FeedModel) => feed
export function useFeed(id?: string | null): FeedModel | undefined
export function useFeed<T>(id: string, selector: (feed: FeedModel) => T): T | undefined
export function useFeed<T>(
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

export const usePrefetchFeed = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["feed", id],
    queryFn: () => feedSyncServices.fetchFeedById({ id }),
    ...options,
  })
}

export const usePrefetchFeedByUrl = (url: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["feed", url],
    queryFn: () => feedSyncServices.fetchFeedByUrl({ url }),
    ...options,
  })
}
