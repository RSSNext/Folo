import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import type { GeneralQueryOptions } from "../types"
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
