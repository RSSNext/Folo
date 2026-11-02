import { FeedViewType } from "@follow/constants"
import { useCollectionEntryList } from "@follow/store/collection/hooks"
import {
  useEntryIdsByFeedId,
  useEntryIdsByFeedIds,
  useEntryIdsByInboxId,
  useEntryIdsByListId,
  useEntryIdsByView,
} from "@follow/store/entry/hooks"
import { useEntryStore } from "@follow/store/entry/store"
import type { UseEntriesReturn } from "@follow/store/entry/types"
import { getEffectiveEntrySortOrder, isTimelineEntriesSource } from "@follow/store/entry/utils"
import { useFolderFeedsByFeedId } from "@follow/store/subscription/hooks"
import { debounce } from "es-toolkit/compat"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { ROUTE_FEED_PENDING } from "~/constants/app"

interface UseLocalEntriesOptions {
  feedId?: string
  view?: FeedViewType
  inboxId?: string
  listId?: string
  isCollection?: boolean
  isPreview?: boolean
  pageSize?: number
}

function getEntryIdsFromMultiplePlace(...entryIds: Array<string[] | undefined | null>) {
  return entryIds.find((ids) => ids?.length) ?? []
}

export const useLocalEntries = ({
  feedId,
  view = FeedViewType.All,
  inboxId,
  listId,
  isCollection,
  isPreview,
  pageSize = 30,
}: UseLocalEntriesOptions = {}): UseEntriesReturn => {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const hidePrivateSubscriptionsInTimeline = useGeneralSettingKey(
    "hidePrivateSubscriptionsInTimeline",
  )
  const savedSortOrder = useGeneralSettingKey("timelineSortOrder")
  const effectiveUnreadOnly = unreadOnly && !isPreview
  const effectiveSortOrder = getEffectiveEntrySortOrder({
    sortOrder: savedSortOrder,
    unreadOnly: effectiveUnreadOnly,
    isTimelineSource: !isPreview && isTimelineEntriesSource({ feedId, inboxId, isCollection }),
  })

  const folderIds = useFolderFeedsByFeedId({
    feedId,
    view,
  })
  const entryIdsByView = useEntryIdsByView(view, hidePrivateSubscriptionsInTimeline)
  const entryIdsByCollections = useCollectionEntryList(view)
  const entryIdsByFeedId = useEntryIdsByFeedId(feedId)
  const entryIdsByCategory = useEntryIdsByFeedIds(folderIds)
  const entryIdsByListId = useEntryIdsByListId(listId)
  const entryIdsByInboxId = useEntryIdsByInboxId(inboxId)

  const showEntriesByView =
    (!feedId || feedId === ROUTE_FEED_PENDING) &&
    folderIds.length === 0 &&
    !isCollection &&
    !inboxId &&
    !listId

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

        const orderedIds = effectiveSortOrder === "asc" ? [...ids].reverse() : ids

        return orderedIds
          .map((id) => {
            const entry = state.data[id]
            if (!entry) return null
            if (effectiveUnreadOnly && entry.read) {
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
        effectiveSortOrder,
        effectiveUnreadOnly,
      ],
    ),
  )

  const [page, setPage] = useState(0)
  const totalPage = useMemo(
    () => (allEntries ? Math.ceil(allEntries.length / pageSize) : 0),
    [allEntries, pageSize],
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

  const fetchNextPage = useCallback(() => {
    const debouncedFetch = debounce(() => {
      setPage((prev) => prev + 1)
    }, 300)
    debouncedFetch()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [view, feedId, effectiveSortOrder, effectiveUnreadOnly])

  return {
    entriesIds: entries,
    hasNext,
    refetch,
    fetchNextPage,
    isLoading: false,
    isRefetching: false,
    isReady: true,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isFetching: false,
    hasNextPage: page < totalPage,
    error: null,
  }
}
