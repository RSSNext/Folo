import type { FeedViewType } from "@follow/constants"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import { useFeedUnreadIsDirty } from "../atoms/feed"
import { FEED_COLLECTION_LIST } from "../constants/app"
import { queryClient } from "../context"
import { getSubscriptionByEntryId } from "../subscription/getter"
import { useSyncUnreadWhenUnMatch } from "../unread/hooks"
import { getEntry } from "./getter"
import { entrySyncServices, useEntryStore } from "./store"
import type { EntryModel, FetchEntriesProps, FetchEntriesPropsSettings } from "./types"

export const invalidateEntriesQuery = ({
  views,
  collection,
}: {
  views?: FeedViewType[]
  collection?: true
}) => {
  return queryClient().invalidateQueries({
    predicate: (query) => {
      const { queryKey } = query
      if (Array.isArray(queryKey) && queryKey[0] === "entries") {
        const feedId = queryKey[1]
        const view = queryKey[4]

        const isCollection = queryKey[7]
        if (views) {
          return views.includes(view as FeedViewType)
        }

        if (collection) {
          return isCollection === true || feedId === FEED_COLLECTION_LIST
        }
      }
      return false
    },
  })
}

const defaultStaleTime = 10 * (60 * 1000) // 10 minutes

export const useEntriesQuery = (
  props?: Omit<FetchEntriesProps, "pageParam" | "read" | "excludePrivate"> &
    FetchEntriesPropsSettings,
) => {
  const {
    feedId,
    inboxId,
    listId,
    view,
    limit,
    feedIdList,
    isCollection,
    unreadOnly,
    hidePrivateSubscriptionsInTimeline,
  } = props || {}

  const fetchUnread = unreadOnly
  const feedUnreadDirty = useFeedUnreadIsDirty((feedId as string) || "")

  const isPop =
    "history" in globalThis && "isPop" in globalThis.history && !!globalThis.history.isPop

  const query = useInfiniteQuery({
    queryKey: [
      "entries",
      feedId,
      inboxId,
      listId,
      view,
      limit,
      feedIdList,
      isCollection,
      unreadOnly,
      hidePrivateSubscriptionsInTimeline,
    ],
    queryFn: ({ pageParam }) =>
      entrySyncServices.fetchEntries({
        ...props,
        pageParam,
        read: unreadOnly ? false : undefined,
        excludePrivate: hidePrivateSubscriptionsInTimeline,
      }),

    getNextPageParam: (lastPage) => lastPage.data?.at(-1)?.entries.publishedAt,
    initialPageParam: undefined as undefined | string,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // DON'T refetch when the router is pop to previous page
    refetchOnMount: fetchUnread && feedUnreadDirty && !isPop ? "always" : false,

    staleTime:
      // Force refetch unread entries when feed is dirty
      // HACK: disable refetch when the router is pop to previous page
      isPop ? Infinity : fetchUnread && feedUnreadDirty ? 0 : defaultStaleTime,
    enabled: !!props,
  })

  const entriesIds = useMemo(() => {
    if (!query.data || query.isLoading || query.isError) {
      return []
    }
    return (
      query.data?.pages
        ?.map((page) => page.data?.map((entry) => entry.entries.id))
        .flat()
        .filter((id) => typeof id === "string") || []
    )
  }, [query.data, query.isLoading, query.isError])

  useSyncUnreadWhenUnMatch(entriesIds)

  return useMemo(() => {
    return {
      ...query,
      entriesIds,
    }
  }, [entriesIds, query])
}

export const usePrefetchEntryDetail = (entryId: string, isInbox?: boolean) => {
  return useQuery({
    queryKey: ["entry", entryId],
    queryFn: () => entrySyncServices.fetchEntryDetail(entryId, isInbox),
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

export const useEntryIdsByView = (view: FeedViewType, excludePrivate: boolean | undefined) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = state.entryIdByView[view]
        if (!ids) return null
        return Array.from(ids)
          .filter((id) => {
            const subscription = getSubscriptionByEntryId(id)
            if ((excludePrivate && subscription?.isPrivate) || subscription?.hideFromTimeline) {
              return false
            }
            return true
          })
          .sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [excludePrivate, view],
    ),
  )
}

export const useEntryIdsByFeedId = (feedId: string | undefined) => {
  return useEntryStore(
    useCallback(
      (state) => {
        if (!feedId) return null
        const ids = state.entryIdByFeed[feedId]
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [feedId],
    ),
  )
}

export const useEntryIdsByFeedIds = (feedIds: string[] | undefined) => {
  return useEntryStore(
    useCallback(
      (state) => {
        const ids = feedIds?.flatMap((feedId) => Array.from(state.entryIdByFeed[feedId] || []))
        if (!ids) return null
        return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
      },
      [feedIds?.toString()],
    ),
  )
}

export const useEntryIdsByInboxId = (inboxId: string | undefined) => {
  return useEntryStore(
    useCallback(
      (state) => {
        if (!inboxId) return null
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

export const useEntryIdsByListId = (listId: string | undefined) => {
  return useEntryStore(
    useCallback(
      (state) => {
        if (!listId) return null
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

export const useEntryReadHistory = (entryId: string, size = 20) => {
  const isInboxEntry = useEntryIsInbox(entryId)
  const { data } = useQuery({
    queryKey: ["entry-read-history", entryId],
    queryFn: () => {
      return entrySyncServices.fetchEntryReadHistory(entryId, size)
    },
    staleTime: 1000 * 60 * 5,
    enabled: !isInboxEntry,
  })

  return data
}
