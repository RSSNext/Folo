import { useMobile } from "@follow/components/hooks/useMobile.js"
import { FeedViewType, views } from "@follow/constants"
import { useTitle } from "@follow/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { isBizId } from "@follow/utils/utils"
import type { Range, Virtualizer } from "@tanstack/react-virtual"
import { memo, useCallback, useEffect, useRef } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { Focusable } from "~/components/common/Focusable"
import { FeedNotFound } from "~/components/errors/FeedNotFound"
import { FEED_COLLECTION_LIST, HotkeyScope, ROUTE_FEED_PENDING } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useFeedQuery } from "~/queries/feed"
import { useFeedHeaderTitle } from "~/store/feed/hooks"

import { EntryColumnWrapper } from "./components/entry-column-wrapper/EntryColumnWrapper"
import { FooterMarkItem } from "./components/FooterMarkItem"
import { EntryColumnGrid } from "./grid"
import { useEntriesByView } from "./hooks/useEntriesByView"
import { useSnapEntryIdList } from "./hooks/useEntryIdListSnap"
import { useEntryMarkReadHandler } from "./hooks/useEntryMarkReadHandler"
import { EntryListHeader } from "./layouts/EntryListHeader"
import { EntryEmptyList, EntryList } from "./list"

function EntryColumnImpl() {
  const listRef = useRef<Virtualizer<HTMLElement, Element>>(undefined)
  const entries = useEntriesByView({
    onReset: useCallback(() => {
      listRef.current?.scrollToIndex(0)
    }, []),
  })

  const { entriesIds, groupedCounts } = entries
  useSnapEntryIdList(entriesIds)

  const {
    entryId: activeEntryId,
    view,
    feedId: routeFeedId,
    isPendingEntry,
    isCollection,
  } = useRouteParams()

  const entry = useEntry(activeEntryId, (state) => {
    const { feedId } = state
    return { feedId }
  })
  const feed = useFeedById(routeFeedId)
  const title = useFeedHeaderTitle()
  useTitle(title)

  useEffect(() => {
    if (!activeEntryId) return

    if (isCollection || isPendingEntry) return
    if (!entry?.feedId) return

    unreadSyncService.markEntryAsRead(activeEntryId)
  }, [activeEntryId, entry?.feedId, isCollection, isPendingEntry])

  const isInteracted = useRef(false)

  const handleMarkReadInRange = useEntryMarkReadHandler(entriesIds)

  const handleScroll = useCallback(() => {
    if (!isInteracted.current) {
      isInteracted.current = true
    }

    if (!routeFeedId) return

    const [first, second] = rangeQueueRef.current
    if (first && second && second.startIndex - first.startIndex > 0) {
      handleMarkReadInRange?.(
        {
          startIndex: first.startIndex,
          endIndex: second.startIndex,
        } as Range,
        isInteracted.current,
      )
    }
  }, [handleMarkReadInRange, routeFeedId])

  const navigate = useNavigateEntry()
  const rangeQueueRef = useRef<Range[]>([])
  const isRefreshing = entries.isFetching && !entries.isFetchingNextPage
  const renderAsRead = useGeneralSettingKey("renderMarkUnread")
  const handleRangeChange = useCallback(
    (e: Range) => {
      const [_, second] = rangeQueueRef.current
      if (second?.startIndex === e.startIndex) {
        return
      }
      rangeQueueRef.current.push(e)
      if (rangeQueueRef.current.length > 2) {
        rangeQueueRef.current.shift()
      }

      if (!renderAsRead) return
      if (!views[view]!.wideMode) {
        return
      }
      // For gird, render as mark read logic
      handleMarkReadInRange?.(e, isInteracted.current)
    },
    [handleMarkReadInRange, renderAsRead, view],
  )

  const fetchNextPage = useCallback(() => {
    if (entries.hasNextPage && !entries.isFetchingNextPage) {
      entries.fetchNextPage()
    }
  }, [entries])
  const isMobile = useMobile()

  const ListComponent = views[view]!.gridMode ? EntryColumnGrid : EntryList
  return (
    <Focusable
      scope={HotkeyScope.Timeline}
      data-hide-in-print
      className="@container relative flex h-full flex-1 flex-col"
      onClick={
        isMobile
          ? undefined
          : () =>
              navigate({
                entryId: null,
              })
      }
    >
      {entriesIds.length === 0 &&
        !entries.isLoading &&
        !entries.error &&
        (!feed || feed?.type === "feed") && <AddFeedHelper />}

      <EntryListHeader
        refetch={entries.refetch}
        isRefreshing={isRefreshing}
        hasUpdate={entries.hasUpdate}
      />

      <EntryColumnWrapper
        onScroll={handleScroll}
        onPullToRefresh={entries.refetch}
        key={`${routeFeedId}-${view}`}
      >
        {entriesIds.length === 0 ? (
          entries.isLoading ? null : (
            <EntryEmptyList />
          )
        ) : (
          <ListComponent
            gap={view === FeedViewType.SocialMedia ? 10 : undefined}
            listRef={listRef}
            onRangeChange={handleRangeChange}
            hasNextPage={entries.hasNextPage}
            view={view}
            feedId={routeFeedId || ""}
            entriesIds={entriesIds}
            fetchNextPage={fetchNextPage}
            refetch={entries.refetch}
            groupCounts={groupedCounts}
            Footer={
              isCollection ? (
                void 0
              ) : (
                <FooterMarkItem view={view} fetchedTime={entries.fetchedTime} />
              )
            }
          />
        )}
      </EntryColumnWrapper>
    </Focusable>
  )
}

const AddFeedHelper = () => {
  const feedId = useRouteParamsSelector((s) => s.feedId)
  const feedQuery = useFeedQuery({ id: feedId })

  const hasSubscription = useSubscriptionByFeedId(feedId || "")

  if (hasSubscription) {
    return null
  }

  if (!feedId) {
    return
  }
  if (feedId === FEED_COLLECTION_LIST || feedId === ROUTE_FEED_PENDING) {
    return null
  }
  if (!isBizId(feedId)) {
    return null
  }

  if (feedQuery.error && feedQuery.error.statusCode === 404) {
    throw new FeedNotFound()
  }
}

export const EntryColumn = memo(EntryColumnImpl)
