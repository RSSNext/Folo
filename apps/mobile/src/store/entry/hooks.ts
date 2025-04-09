import type { FeedViewType } from "@follow/constants"
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"

import { getEntry } from "./getter"
import { entrySyncServices, useEntryStore } from "./store"
import type { EntryModel, FetchEntriesProps } from "./types"

export const usePrefetchEntries = (props: Omit<FetchEntriesProps, "pageParam" | "read"> | null) => {
  const { feedId, inboxId, listId, view, limit, feedIdList } = props || {}
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  return useInfiniteQuery({
    queryKey: ["entries", feedId, inboxId, listId, view, unreadOnly, limit, feedIdList],
    queryFn: ({ pageParam }) =>
      entrySyncServices.fetchEntries({ ...props, pageParam, read: unreadOnly ? false : undefined }),
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
export function useEntry(id: string): EntryModel | undefined
export function useEntry<T>(id: string, selector: (state: EntryModel) => T): T | undefined
export function useEntry(
  id: string,
  selector: (state: EntryModel) => EntryModel = defaultSelector,
) {
  return useEntryStore((state) => {
    const entry = state.data[id]
    if (!entry) return
    return selector(entry)
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

export const useFetchEntryContentByStream = (remoteEntryIds?: string[]) => {
  const { mutate: updateEntryContent } = useMutation({
    mutationKey: ["stream-entry-content", remoteEntryIds],
    mutationFn: entrySyncServices.fetchEntryContentByStream,
  })

  useEffect(() => {
    if (!remoteEntryIds) return
    updateEntryContent(remoteEntryIds)
  }, [remoteEntryIds, updateEntryContent])
}
