import type { FeedViewType } from "@follow/constants"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { getEntry } from "./getter"
import { entrySyncServices, useEntryStore } from "./store"
import type { EntryModel, FetchEntriesProps } from "./types"

export const usePrefetchEntries = (props: FetchEntriesProps) => {
  const { feedId, inboxId, listId, view, read, limit, pageParam, isArchived } = props
  return useQuery({
    queryKey: ["entries", feedId, inboxId, listId, view, read, limit, pageParam, isArchived],
    queryFn: () => entrySyncServices.fetchEntries(props),
  })
}
export const usePrefetchEntryContent = (entryId: string) => {
  return useQuery({
    queryKey: ["entry", entryId],
    queryFn: () => entrySyncServices.fetchEntryContent(entryId),
  })
}

export const useEntry = (id: string): EntryModel | undefined => {
  return useEntryStore((state) => state.data[id])
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
        if (!ids) return []
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
        if (!ids) return []
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
        if (!ids) return []
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
        if (!ids) return []
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [category],
    ),
  )
}
