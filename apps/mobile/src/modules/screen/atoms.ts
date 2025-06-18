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
import { fallbackReturn } from "@follow/store/entry/utils"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { useListById } from "@follow/store/list/hooks"
import { getSubscriptionByCategory } from "@follow/store/subscription/getter"
import { jotaiStore } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { debounce } from "es-toolkit"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

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

export const EntryListContext = createContext<{ type: "timeline" | "feed" | "subscriptions" }>({
  type: "timeline",
})
export const useEntryListContext = () => {
  return use(EntryListContext)
}

export function useSelectedView() {
  return useAtomValue(useMemo(() => selectAtom(selectedTimelineAtom, (state) => state.viewId), []))
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

function useRemoteEntries(props?: UseEntriesProps): UseEntriesReturn {
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
  const options = useFetchEntriesSettings()

  const query = useEntriesQuery(props?.active ? { ...payload, ...options } : undefined)

  const refetch = useCallback(async () => void query.refetch(), [query])
  const fetchNextPage = useCallback(async () => void query.fetchNextPage(), [query])
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

  if (!query.data || query.isLoading) {
    return fallbackReturn
  }

  return {
    entriesIds,
    hasNext: query.hasNextPage,
    hasUpdate: false,
    refetch,
    fetchNextPage,
    isLoading: query.isFetching,
    isRefetching: query.isRefetching,
    isReady: query.isSuccess,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetching: query.isFetching,
    hasNextPage: query.hasNextPage,
    error: query.isError ? query.error : null,
  }
}

function useLocalEntries(props?: UseEntriesProps): UseEntriesReturn {
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
  const options = useFetchEntriesSettings()

  const { feedId, feedIdList, listId, inboxId, isCollection } = payload || {}
  const { hidePrivateSubscriptionsInTimeline, unreadOnly } = options

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
        const ids = showEntriesByView
          ? (entryIdsByView ?? [])
          : (getEntryIdsFromMultiplePlace(
              entryIdsByCollections,
              entryIdsByFeedId,
              entryIdsByCategory,
              entryIdsByListId,
              entryIdsByInboxId,
            ) ?? [])

        return ids
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
        showEntriesByView,
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
  }, [view, feedId])

  return {
    entriesIds: entries,
    hasNext,
    hasUpdate: false,
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
  const query = remoteQuery.isReady ? remoteQuery : localQuery
  return query
}

export const useSelectedFeedTitle = () => {
  const selectedFeed = useSelectedFeed()

  const viewDef = useViewDefinition(
    selectedFeed && selectedFeed.type === "view" ? selectedFeed.viewId : undefined,
  )
  const feed = useFeedById(selectedFeed && selectedFeed.type === "feed" ? selectedFeed.feedId : "")
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
      return selectedFeed.feedId === FEED_COLLECTION_LIST ? t("words.starred") : (feed?.title ?? "")
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
