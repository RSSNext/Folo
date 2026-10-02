import type { FeedViewType } from "@follow/constants"
import type { InfiniteData, InfiniteQueryObserver, Query, QueryKey } from "@tanstack/react-query"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import { FEED_COLLECTION_LIST } from "../../constants/app"
import { queryClient } from "../../context"
import { useFeedUnreadIsDirty } from "../feed/hooks"
import { useSyncUnreadWhenUnMatch } from "../unread/hooks"
import type { UnreadListScope } from "../unread/types"
import {
  getEntryIdsByCategorySelector,
  getEntryIdsByFeedIdSelector,
  getEntryIdsByFeedIdsSelector,
  getEntryIdsByInboxIdSelector,
  getEntryIdsByListIdSelector,
  getEntryIdsByViewSelector,
  getEntryIsInboxSelector,
  getHasEntrySelector,
} from "./getter"
import { entrySyncServices, useEntryStore } from "./store"
import type { EntryModel, FetchEntriesProps, FetchEntriesPropsSettings } from "./types"
import {
  getEffectiveEntrySortOrder,
  isTimelineEntriesSource,
  mergeEntriesHead,
  trimTrailingEmptyPages,
} from "./utils"

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

type EntriesPage = Awaited<ReturnType<typeof entrySyncServices.fetchEntries>>
type EntriesQueryData = InfiniteData<EntriesPage, string | undefined>

const readEntriesQueryKey = (queryKey: QueryKey) => {
  const [
    ,
    feedId,
    inboxId,
    listId,
    view,
    limit,
    feedIdList,
    isCollection,
    unreadOnly,
    hidePrivateSubscriptionsInTimeline,
    aiSort,
    sortOrder,
  ] = queryKey as [
    string,
    FetchEntriesProps["feedId"],
    FetchEntriesProps["inboxId"],
    FetchEntriesProps["listId"],
    FetchEntriesProps["view"],
    FetchEntriesProps["limit"],
    FetchEntriesProps["feedIdList"],
    FetchEntriesProps["isCollection"],
    boolean | undefined,
    boolean | undefined,
    boolean | undefined,
    FetchEntriesProps["sortOrder"],
  ]
  return {
    feedId,
    inboxId,
    listId,
    view,
    limit,
    feedIdList,
    isCollection,
    unreadOnly,
    hidePrivateSubscriptionsInTimeline,
    aiSort,
    sortOrder,
  }
}

/**
 * An oldest-first list receives new entries at its end. When it was scrolled to the end, the
 * empty page that marked it is dropped and the page after the last entry is requested again.
 * A list that still has pages to load picks the new entries up when the user gets there.
 */
const refreshEntriesTail = async (query: Query) => {
  const observer = query.observers.find(
    (candidate): candidate is InfiniteQueryObserver =>
      typeof (candidate as InfiniteQueryObserver).fetchNextPage === "function",
  )
  if (!observer) return

  const current = query.state.data as EntriesQueryData | undefined
  const trimmed = trimTrailingEmptyPages(current)
  if (!trimmed || trimmed.pages.length === 0) return
  if (trimmed === current && (current.pages.at(-1)?.data?.length ?? 0) > 0) {
    // The end was never reached; the list still loads on scroll.
    return
  }
  if (trimmed !== current) {
    queryClient().setQueryData<EntriesQueryData>(query.queryKey, trimmed)
  }
  await observer.fetchNextPage({ cancelRefetch: false })
}

/**
 * New entries arrived for these views. Fetch the edge of the entry lists that are on screen
 * where they arrive, the first page of a newest-first list, and merge it into what is loaded,
 * instead of refetching every loaded page.
 *
 * Lists that are not mounted are left alone: they are fetched again when they are opened.
 */
export const refreshEntriesHead = async ({
  views,
  since,
}: {
  views: FeedViewType[]
  /** Lists fetched after this moment already contain the new entries. */
  since?: number
}) => {
  const client = queryClient()
  const queries = client.getQueryCache().findAll({
    predicate: (query) => {
      const { queryKey } = query
      return (
        Array.isArray(queryKey) &&
        queryKey[0] === "entries" &&
        views.includes(queryKey[4] as FeedViewType)
      )
    },
  })

  await Promise.all(
    queries.map(async (query) => {
      const params = readEntriesQueryKey(query.queryKey)
      const isCollectionQuery =
        params.isCollection === true || params.feedId === FEED_COLLECTION_LIST
      // Collections do not change with new entries, and an AI sorted page is expensive to
      // recompute.
      if (isCollectionQuery || params.aiSort) return
      if (!query.isActive() || query.state.fetchStatus === "fetching") return
      if (!query.state.data) return
      if (since !== undefined && query.state.dataUpdatedAt > since) return

      if (params.sortOrder === "asc") {
        await refreshEntriesTail(query)
        return
      }

      const head = await entrySyncServices.fetchEntries({
        feedId: params.feedId,
        inboxId: params.inboxId,
        listId: params.listId,
        view: params.view,
        limit: params.limit,
        feedIdList: params.feedIdList,
        isCollection: params.isCollection,
        read: params.unreadOnly ? false : undefined,
        excludePrivate: params.hidePrivateSubscriptionsInTimeline,
        sortOrder: params.sortOrder,
        pageParam: undefined,
      })
      client.setQueryData<EntriesQueryData>(query.queryKey, (current) =>
        mergeEntriesHead(current, head),
      )
    }),
  )
}

const defaultStaleTime = 10 * (60 * 1000) // 10 minutes
const toPageParam = (value: Date | string | null | undefined) => {
  if (!value) return
  return typeof value === "string" ? value : value.toISOString()
}

export const useEntriesQuery = (
  props?: Omit<FetchEntriesProps, "pageParam" | "read" | "excludePrivate"> &
    FetchEntriesPropsSettings,
  options?: {
    subscribed?: boolean
  },
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
    aiSort,
    sortOrder,
  } = props || {}

  const fetchUnread = unreadOnly
  const feedUnreadDirty = useFeedUnreadIsDirty((feedId as string) || "")
  const effectiveSortOrder = getEffectiveEntrySortOrder({
    sortOrder: aiSort ? "desc" : sortOrder,
    unreadOnly: unreadOnly === true,
    isTimelineSource: isTimelineEntriesSource({ feedId, inboxId, isCollection }),
  })

  const isPop =
    "history" in globalThis && "isPop" in globalThis.history && !!globalThis.history.isPop
  const isCollectionQuery = isCollection === true || feedId === FEED_COLLECTION_LIST
  const queryKey = useMemo(
    () => [
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
      aiSort,
      effectiveSortOrder,
    ],
    [
      feedId,
      inboxId,
      listId,
      view,
      limit,
      feedIdList,
      isCollection,
      unreadOnly,
      hidePrivateSubscriptionsInTimeline,
      aiSort,
      effectiveSortOrder,
    ],
  )

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      entrySyncServices.fetchEntries({
        ...props,
        limit: aiSort ? 100 : limit,
        pageParam,
        read: unreadOnly ? false : undefined,
        excludePrivate: hidePrivateSubscriptionsInTimeline,
        sortOrder: effectiveSortOrder,
      }),

    getNextPageParam: (lastPage) => {
      if (aiSort) return

      const lastEntry = lastPage.data?.at(-1)
      return isCollectionQuery
        ? (toPageParam(lastEntry?.collections?.createdAt) ??
            toPageParam(lastEntry?.entries.publishedAt))
        : toPageParam(lastEntry?.entries.publishedAt)
    },
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
    subscribed: options?.subscribed,
  })
  const { fetchNextPage: queryFetchNextPage, refetch: queryRefetch } = query
  const fetchNextPage = useCallback(
    (options?: Parameters<typeof queryFetchNextPage>[0]) =>
      queryFetchNextPage({ cancelRefetch: false, ...options }),
    [queryFetchNextPage],
  )
  // A refresh starts over from the top. Without trimming, the infinite query would request
  // every page the user had scrolled through again, one after another.
  const refetch = useCallback(
    (options?: Parameters<typeof queryRefetch>[0]) => {
      queryClient().setQueryData<EntriesQueryData>(queryKey, (current) =>
        current && current.pages.length > 1
          ? { pages: current.pages.slice(0, 1), pageParams: current.pageParams.slice(0, 1) }
          : current,
      )
      return queryRefetch(options)
    },
    [queryKey, queryRefetch],
  )

  const entriesIds = useMemo(() => {
    if (!query.data || query.isLoading || query.isError) {
      return []
    }
    return (
      query.data?.pages
        ?.flatMap((page) => page.data?.map((entry) => entry.entries.id))
        .filter((id) => typeof id === "string") || []
    )
  }, [query.data, query.isLoading, query.isError])

  const unreadScope = useMemo<UnreadListScope>(
    () => ({
      view,
      feedId: feedId === undefined ? undefined : String(feedId),
      feedIdList,
      listId: listId === undefined ? undefined : String(listId),
      inboxId: inboxId === undefined ? undefined : String(inboxId),
      isCollection,
      excludePrivate: hidePrivateSubscriptionsInTimeline === true,
    }),
    [
      view,
      feedId,
      feedIdList?.toString(),
      listId,
      inboxId,
      isCollection,
      hidePrivateSubscriptionsInTimeline,
    ],
  )
  // Once every unread entry is on screen, a counter above the list can only be wrong.
  const unreadListComplete =
    fetchUnread === true &&
    !aiSort &&
    query.isSuccess &&
    !query.isFetching &&
    query.hasNextPage === false
  useSyncUnreadWhenUnMatch(entriesIds, { scope: unreadScope, complete: unreadListComplete })

  return useMemo(() => {
    return {
      ...query,
      fetchNextPage,
      refetch,
      entriesIds,
      queryKey,
    }
  }, [entriesIds, fetchNextPage, query, queryKey, refetch])
}

export const usePrefetchEntryDetail = (entryId: string | undefined, isInbox?: boolean) => {
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
export const useHasEntry = (id: string) => {
  return useEntryStore(useCallback((state) => getHasEntrySelector(state)(id), [id]))
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

export const useEntryIdsByView = (view: FeedViewType, excludePrivate: boolean | undefined) => {
  return useEntryStore(
    useCallback(
      (state) => getEntryIdsByViewSelector(state)(view, excludePrivate),
      [excludePrivate, view],
    ),
  )
}

export const useEntryIdsByFeedId = (feedId: string | undefined | null) => {
  return useEntryStore(useCallback((state) => getEntryIdsByFeedIdSelector(state)(feedId), [feedId]))
}

export const useEntryIdsByFeedIds = (feedIds: string[] | undefined) => {
  return useEntryStore(
    useCallback((state) => getEntryIdsByFeedIdsSelector(state)(feedIds), [feedIds?.toString()]),
  )
}

export const useEntryIdsByInboxId = (inboxId: string | undefined) => {
  return useEntryStore(
    useCallback((state) => getEntryIdsByInboxIdSelector(state)(inboxId), [inboxId]),
  )
}

export const useEntryIdsByCategory = (category: string) => {
  return useEntryStore(
    useCallback((state) => getEntryIdsByCategorySelector(state)(category), [category]),
  )
}

export const useEntryIdsByListId = (listId: string | undefined) => {
  return useEntryStore(useCallback((state) => getEntryIdsByListIdSelector(state)(listId), [listId]))
}

export const useEntryIsInbox = (entryId: string) => {
  return useEntryStore(useCallback((state) => getEntryIsInboxSelector(state)(entryId), [entryId]))
}

export const useEntryReadHistory = (entryId: string, size = 20, enabled = true) => {
  const isInboxEntry = useEntryIsInbox(entryId)
  const { data } = useQuery({
    queryKey: ["entry-read-history", entryId],
    queryFn: () => {
      return entrySyncServices.fetchEntryReadHistory(entryId, size)
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !isInboxEntry,
  })

  return data
}
