import { FeedViewType } from "@follow/constants"
import { useCollectionEntryList } from "@follow/store/collection/hooks"
import { FEED_COLLECTION_LIST } from "@follow/store/constants/app"
import {
  useEntriesQuery,
  useEntryIdsByFeedId,
  useEntryIdsByFeedIds,
  useEntryIdsByInboxId,
  useEntryIdsByListId,
  useEntryIdsByView,
} from "@follow/store/entry/hooks"
import { useEntryStore } from "@follow/store/entry/store"
import type {
  FetchEntriesProps,
  UseEntriesProps,
  UseEntriesReturn,
} from "@follow/store/entry/types"
import { fallbackReturn, isTimelineEntriesSource } from "@follow/store/entry/utils"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { useListById } from "@follow/store/list/hooks"
import { getSubscriptionByCategory } from "@follow/store/subscription/getter"
import { useSubscriptionByFeedId, useViewWithSubscription } from "@follow/store/subscription/hooks"
import { jotaiStore } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { debounce } from "es-toolkit"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import type { ReactNode } from "react"
import { createContext, createElement, use, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { SharedValue } from "react-native-reanimated"
import { makeMutable, useSharedValue } from "react-native-reanimated"

import { useFetchEntriesSettings } from "@/src/atoms/settings/general"
import { views } from "@/src/constants/views"

export type SelectedTimeline = {
  type: "view"
  viewId: FeedViewType
}

export type SelectedFeed =
  | {
      type: "feed"
      feedId: string
    }
  | {
      type: "category"
      categoryName: string
    }
  | {
      type: "list"
      listId: string
    }
  | {
      type: "inbox"
      inboxId: string
    }
  | null

const selectedTimelineAtom = atom<SelectedTimeline>({
  type: "view",
  viewId: FeedViewType.Articles,
})

const selectedFeedAtom = atom<SelectedFeed>(null)

export const EntryListContext = createContext<{
  type: "timeline" | "feed" | "subscriptions"
  isPreview?: boolean
  // The view of the subscription a feed screen shows, which wins over the view selected on Home
  view?: FeedViewType
}>({ type: "timeline" })
export const useEntryListContext = () => {
  return use(EntryListContext)
}

export function useSelectedView() {
  const { view } = useEntryListContext()
  const selectedView = useAtomValue(
    useMemo(() => selectAtom(selectedTimelineAtom, (state) => state.viewId), []),
  )
  return view ?? selectedView
}

export const getSelectedView = () => {
  return jotaiStore.get(selectedTimelineAtom).viewId
}

export function useSelectedFeed(): SelectedTimeline | SelectedFeed
export function useSelectedFeed<T>(
  selector?: (selectedFeed: SelectedTimeline | SelectedFeed) => T,
): T | null
export function useSelectedFeed<T>(
  selector?: (selectedFeed: SelectedTimeline | SelectedFeed) => T,
) {
  const entryListContext = useEntryListContext()

  const [stableSelector] = useState(() => selector)
  return useAtomValue(
    useMemo(
      () =>
        atom((get) => {
          const selectedTimeline = get(selectedTimelineAtom)
          const selectedFeed = get(selectedFeedAtom)
          const result = entryListContext.type === "feed" ? selectedFeed : selectedTimeline
          if (stableSelector) {
            return stableSelector(result)
          }
          return result
        }),
      [entryListContext, stableSelector],
    ),
  )
}

export const getFetchEntryPayload = (
  selectedFeed: SelectedTimeline | SelectedFeed,
  view: FeedViewType = FeedViewType.Articles,
): FetchEntriesProps | null => {
  if (!selectedFeed) {
    return null
  }

  let payload: FetchEntriesProps = {}
  switch (selectedFeed.type) {
    case "view": {
      payload = { view: selectedFeed.viewId }
      break
    }
    case "feed": {
      payload = { feedId: selectedFeed.feedId }
      break
    }
    case "category": {
      payload = {
        feedIdList: getSubscriptionByCategory({ category: selectedFeed.categoryName, view }),
      }
      break
    }
    case "list": {
      payload = { listId: selectedFeed.listId }
      break
    }
    case "inbox": {
      payload = { inboxId: selectedFeed.inboxId }
      break
    }
    // No default
  }
  const isCollection =
    selectedFeed && selectedFeed.type === "feed" && selectedFeed?.feedId === FEED_COLLECTION_LIST
  if (isCollection) {
    payload.view = view
    payload.isCollection = true
  }

  return payload
}

export function useIsTimelineEntrySource() {
  const entryListContext = useEntryListContext()
  const selectedFeed = useSelectedFeed()
  const selectedView = useSelectedView()
  const payload = getFetchEntryPayload(selectedFeed, selectedView)

  return !entryListContext.isPreview && payload !== null && isTimelineEntriesSource(payload)
}

function useRemoteEntries(props?: UseEntriesProps): UseEntriesReturn {
  const entryListContext = useEntryListContext()
  const selectedFeed = useSelectedFeed()
  const selectedView = useSelectedView()
  const view = props?.viewId ?? selectedView
  const payload = getFetchEntryPayload(
    selectedFeed?.type === "view"
      ? {
          type: "view",
          viewId: view,
        }
      : selectedFeed,
    view,
  )
  const options = useFetchEntriesSettings({
    isTimelineSource:
      !entryListContext.isPreview && payload !== null && isTimelineEntriesSource(payload),
    unreadOnlyEnabled: !entryListContext.isPreview,
  })

  const query = useEntriesQuery(payload ? { ...payload, ...options } : undefined, {
    subscribed: props?.active !== false,
  })

  // When the list was last loaded from its first page, which is what the footer marks as read
  // before. Loading the next page shows older entries and must not move it.
  const isFetchingFirstPage = query.isFetching && !query.isFetchingNextPage
  const [fetchedTime, setFetchedTime] = useState<number>()
  useEffect(() => {
    if (!isFetchingFirstPage) {
      setFetchedTime(Date.now())
    }
  }, [isFetchingFirstPage])

  const refetch = useCallback(async () => void query.refetch(), [query])
  const fetchNextPage = useCallback(async () => void query.fetchNextPage(), [query])

  if (!query.data || query.isLoading) {
    // Without data yet, still report a failed first page and keep the remote refetch, so the
    // timeline can fall back to the stored entries and pull to refresh tries the server again
    return {
      ...fallbackReturn,
      refetch,
      fetchNextPage,
      isLoading: !query.isError,
      isRefetching: query.isRefetching,
      isFetching: query.isFetching,
      error: query.isError ? query.error : null,
    }
  }

  return {
    entriesIds: query.entriesIds,
    hasNext: query.hasNextPage,
    refetch,
    fetchNextPage,
    isLoading: query.isFetching,
    isRefetching: query.isRefetching,
    isReady: query.isSuccess,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetching: query.isFetching,
    hasNextPage: query.hasNextPage,
    error: query.isError ? query.error : null,
    fetchedTime,
  }
}

function useLocalEntries(props?: UseEntriesProps): UseEntriesReturn {
  const entryListContext = useEntryListContext()
  const selectedFeed = useSelectedFeed()
  const selectedView = useSelectedView()
  const view = props?.viewId ?? selectedView
  const payload = getFetchEntryPayload(
    selectedFeed?.type === "view"
      ? {
          type: "view",
          viewId: view,
        }
      : selectedFeed,
    view,
  )
  const options = useFetchEntriesSettings({
    isTimelineSource:
      !entryListContext.isPreview && payload !== null && isTimelineEntriesSource(payload),
    unreadOnlyEnabled: !entryListContext.isPreview,
  })

  const { feedId, feedIdList, listId, inboxId, isCollection } = payload || {}
  const { hidePrivateSubscriptionsInTimeline, sortOrder, unreadOnly } = options

  const entryIdsByView = useEntryIdsByView(view, hidePrivateSubscriptionsInTimeline)
  const entryIdsByCollections = useCollectionEntryList(view)
  const entryIdsByFeedId = useEntryIdsByFeedId(feedId)
  const entryIdsByCategory = useEntryIdsByFeedIds(feedIdList)
  const entryIdsByListId = useEntryIdsByListId(listId)
  const entryIdsByInboxId = useEntryIdsByInboxId(inboxId)

  const showEntriesByView =
    !feedId && (!feedIdList || feedIdList?.length === 0) && !isCollection && !inboxId && !listId

  const allEntries = useEntryStore(
    useCallback(
      (state) => {
        const ids = isCollection
          ? entryIdsByCollections
          : showEntriesByView
            ? (entryIdsByView ?? [])
            : (getEntryIdsFromMultiplePlace(
                entryIdsByFeedId,
                entryIdsByCategory,
                entryIdsByListId,
                entryIdsByInboxId,
              ) ?? [])

        const orderedIds = sortOrder === "asc" ? [...ids].reverse() : ids

        return orderedIds
          .map((id) => {
            const entry = state.data[id]
            if (!entry) return null
            if (unreadOnly && entry.read) {
              return null
            }
            return entry.id
          })
          .filter((id) => typeof id === "string")
      },
      [
        entryIdsByCategory,
        entryIdsByCollections,
        entryIdsByFeedId,
        entryIdsByInboxId,
        entryIdsByListId,
        entryIdsByView,
        isCollection,
        showEntriesByView,
        sortOrder,
        unreadOnly,
      ],
    ),
  )

  const [page, setPage] = useState(0)
  const pageSize = 30
  const totalPage = useMemo(
    () => (allEntries ? Math.ceil(allEntries.length / pageSize) : 0),
    [allEntries],
  )

  const entries = useMemo(() => {
    return allEntries?.slice(0, (page + 1) * pageSize) || []
  }, [allEntries, page, pageSize])

  const hasNext = useMemo(() => {
    return entries.length < (allEntries?.length || 0)
  }, [entries.length, allEntries])

  const refetch = useCallback(async () => {
    setPage(0)
  }, [])

  const fetchNextPage = useCallback(
    debounce(async () => {
      setPage(page + 1)
    }, 300),
    [page],
  )

  useEffect(() => {
    setPage(0)
  }, [view, feedId, sortOrder, unreadOnly])

  return {
    entriesIds: entries,
    hasNext,
    refetch,
    fetchNextPage,
    isLoading: false,
    isRefetching: false,
    isReady: true,
    isFetchingNextPage: false,
    isFetching: false,
    hasNextPage: page < totalPage,
    error: null,
  }
}

function getEntryIdsFromMultiplePlace(...entryIds: Array<string[] | undefined | null>) {
  return entryIds.find((ids) => ids?.length) ?? []
}

export function useEntries(props?: UseEntriesProps): UseEntriesReturn {
  const { viewId, active = true } = props || {}
  const remoteQuery = useRemoteEntries({ viewId, active })
  const localQuery = useLocalEntries({ viewId, active })
  const entryListContext = useEntryListContext()
  const selectedFeed = useSelectedFeed()

  const isTimelineViewQuery = entryListContext.type === "timeline" && selectedFeed?.type === "view"

  if (isTimelineViewQuery) {
    if (remoteQuery.isReady) {
      return remoteQuery
    }

    if (remoteQuery.error) {
      return {
        ...localQuery,
        // Pulling to refresh retries the server rather than the stored entries
        refetch: remoteQuery.refetch,
        isFetching: remoteQuery.isFetching,
        isRefetching: remoteQuery.isRefetching,
        error: remoteQuery.error,
        isReady: true,
      }
    }

    return {
      ...fallbackReturn,
      refetch: remoteQuery.refetch,
      fetchNextPage: remoteQuery.fetchNextPage,
      isLoading: remoteQuery.isLoading,
      isFetching: remoteQuery.isFetching,
      isRefetching: remoteQuery.isRefetching,
    }
  }

  const query = remoteQuery.isReady ? remoteQuery : localQuery
  return {
    ...query,
    isReady: remoteQuery.isReady,
  }
}

export const useSelectedFeedTitle = () => {
  const selectedFeed = useSelectedFeed()

  const viewDef = useViewDefinition(
    selectedFeed && selectedFeed.type === "view" ? selectedFeed.viewId : undefined,
  )
  const feed = useFeedById(selectedFeed && selectedFeed.type === "feed" ? selectedFeed.feedId : "")
  const feedSubscription = useSubscriptionByFeedId(
    selectedFeed && selectedFeed.type === "feed" ? selectedFeed.feedId : "",
  )
  const list = useListById(selectedFeed && selectedFeed.type === "list" ? selectedFeed.listId : "")
  const inbox = useInboxById(
    selectedFeed && selectedFeed.type === "inbox" ? selectedFeed.inboxId : "",
  )
  const { t } = useTranslation("common")

  if (!selectedFeed) {
    return ""
  }

  switch (selectedFeed.type) {
    case "view": {
      return viewDef?.name ? t(viewDef.name) : ""
    }
    case "feed": {
      return selectedFeed.feedId === FEED_COLLECTION_LIST
        ? t("words.starred")
        : feedSubscription?.title || feed?.title || ""
    }
    case "category": {
      return selectedFeed.categoryName
    }
    case "list": {
      return list?.title
    }
    case "inbox": {
      return inbox?.title ?? t("words.inbox")
    }
  }
}

declare module "@follow/utils/event-bus" {
  export interface CustomEvent {
    SELECT_TIMELINE: {
      view: SelectedTimeline
      target: string | undefined
    }
  }
}

export const selectTimeline = (state: SelectedTimeline, target?: string) => {
  jotaiStore.set(selectedTimelineAtom, state)
  EventBus.dispatch("SELECT_TIMELINE", {
    view: state,
    target,
  })
}

export const selectFeed = (state: SelectedFeed) => {
  jotaiStore.set(selectedFeedAtom, state)
}

export const useViewDefinition = (view?: FeedViewType) => {
  const viewDef = useMemo(() => views.find((v) => v.view === view), [view])
  return viewDef
}

const TimelineSelectorDragProgressContext = createContext<SharedValue<number> | null>(null)

export const TimelineSelectorDragProgressProvider = ({ children }: { children: ReactNode }) => {
  const selectedFeed = useSelectedFeed()
  const viewId = selectedFeed?.type === "view" ? selectedFeed.viewId : undefined

  const activeViews = useViewWithSubscription()

  const activeViewIndex = useMemo(
    () => activeViews.indexOf(viewId as FeedViewType),
    [activeViews, viewId],
  )
  const initialPage = activeViewIndex
  const dragProgress = useSharedValue(initialPage)

  return createElement(
    TimelineSelectorDragProgressContext,
    {
      value: dragProgress,
    },
    children,
  )
}

export const useTimelineSelectorDragProgress = () => {
  const dragProgress = use(TimelineSelectorDragProgressContext)
  if (!dragProgress) {
    console.error(
      "useTimelineSelectorDragProgress must be used within TimelineSelectorDragProgressProvider",
    )
    return makeMutable(0)
  }
  return dragProgress
}
