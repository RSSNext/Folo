import type { FeedViewType } from "@follow/constants"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { getEntry } from "./getter"
import { entrySyncServices, useEntryStore } from "./store"
import type { EntryModel, FetchEntriesProps, FetchEntriesPropsSettings } from "./types"

export const usePrefetchEntries = (
  props: Omit<FetchEntriesProps, "pageParam" | "read"> & FetchEntriesPropsSettings,
) => {
  const {
    feedId,
    inboxId,
    listId,
    view,
    limit,
    feedIdList,
    unreadOnly,
    hidePrivateSubscriptionsInTimeline,
  } = props || {}

  return useInfiniteQuery({
    queryKey: [
      "entries",
      feedId,
      inboxId,
      listId,
      view,
      unreadOnly,
      limit,
      feedIdList,
      hidePrivateSubscriptionsInTimeline,
    ],
    queryFn: ({ pageParam }) =>
      entrySyncServices.fetchEntries({
        ...props,
        pageParam,
        read: unreadOnly ? false : undefined,
        excludePrivate: hidePrivateSubscriptionsInTimeline,
      }),
    staleTime: 3 * 60 * 1000,
    getNextPageParam: (lastPage) => lastPage.data?.at(-1)?.entries.publishedAt,
    initialPageParam: undefined as undefined | string,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!props,
  })
}
export const usePrefetchEntryDetail = (entryId: string) => {
  return useQuery({
    queryKey: ["entry", entryId],
    queryFn: () => entrySyncServices.fetchEntryDetail(entryId),
  })
}

const defaultSelector = (state: EntryModel) => state

export function useEntry<T>(
  id: string | undefined,
  selector: (state: EntryModel) => T,
): T | undefined {
  return useEntryStore((state) => {
    if (!id) return
    const entry = state.data[id]
    if (!entry) return
    return selector(entry)
  })
}

export function useEntryList(ids: string[]): Array<EntryModel | null>
export function useEntryList<T>(ids: string[], selector: (state: EntryModel) => T): T[] | undefined
export function useEntryList(
  ids: string[],
  selector: (state: EntryModel) => EntryModel = defaultSelector,
) {
  return useEntryStore((state) => {
    return ids.map((id) => {
      const entry = state.data[id]
      if (!entry) return null
      return selector(entry)
    })
  })
}

function sortEntryIdsByPublishDate(a: string, b: string) {
  const entryA = getEntry(a)
  const entryB = getEntry(b)
  if (!entryA || !entryB) return 0
  return entryB.publishedAt.getTime() - entryA.publishedAt.getTime()
}

export const useEntryIdsByView = (view: FeedViewType) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = state.entryIdByView[view]
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [view],
    ),
  )
}

export const useEntryIdsByFeedId = (feedId: string) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = state.entryIdByFeed[feedId]
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [feedId],
    ),
  )
}

export const useEntryIdsByInboxId = (inboxId: string) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = state.entryIdByInbox[inboxId]
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [inboxId],
    ),
  )
}

export const useEntryIdsByCategory = (category: string) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = state.entryIdByCategory[category]
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [category],
    ),
  )
}

export const useEntryIdsByListId = (listId: string) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = state.entryIdByList[listId]
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [listId],
    ),
  )
}

export const useEntryIsInbox = (entryId: string) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const entry = state.data[entryId]
        if (!entry) return false
        return !!entry.inboxHandle
      },
      [entryId],
    ),
  )
}
