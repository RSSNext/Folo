import { FeedViewType, getView } from "@follow/constants"
import { useTitle } from "@follow/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { isBizId } from "@follow/utils/utils"
import type { Range, Virtualizer } from "@tanstack/react-virtual"
import { atom } from "jotai"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"

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
import { useEntriesActions, useEntriesState } from "./context/EntriesContext"
import { EntryItemSkeleton } from "./EntryItemSkeleton"
import { EntryColumnGrid } from "./grid"
import { useAttachScrollBeyond } from "./hooks/useAttachScrollBeyond"
import { useSnapEntryIdList } from "./hooks/useEntryIdListSnap"
import { useEntryMarkReadHandler } from "./hooks/useEntryMarkReadHandler"
import { EntryListHeader } from "./layouts/EntryListHeader"
import { EntryEmptyList, EntryList } from "./list"
import { EntryRootStateContext } from "./store/EntryColumnContext"

function EntryColumnContent() {
  const listRef = useRef<Virtualizer<HTMLElement, Element>>(undefined)
  const state = useEntriesState()
  const actions = useEntriesActions()
  // Register reset handler to keep scroll behavior when data resets
  useEffect(() => {
    actions.setOnReset(() => {
      listRef.current?.scrollToIndex(0)
    })
    return () => actions.setOnReset(null)
  }, [actions])

  const { entriesIds, groupedCounts } = state
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

  const { handleScroll: handleScrollBeyond } = useAttachScrollBeyond()
  const handleCombinedScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      handleScrollBeyond(e)
      handleScroll()
    },
    [handleScrollBeyond, handleScroll],
  )

  const navigate = useNavigateEntry()
  const rangeQueueRef = useRef<Range[]>([])
  const isRefreshing = state.isFetching && !state.isFetchingNextPage
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
      if (!getView(view)?.wideMode) {
        return
      }
      // For gird, render as mark read logic
      handleMarkReadInRange?.(e, isInteracted.current)
    },
    [handleMarkReadInRange, renderAsRead, view],
  )

  const fetchNextPage = useCallback(() => {
    if (state.hasNextPage && !state.isFetchingNextPage) {
      actions.fetchNextPage()
    }
  }, [actions, state.hasNextPage, state.isFetchingNextPage])

  const ListComponent = getView(view)?.gridMode ? EntryColumnGrid : EntryList

  return (
    <Focusable
      scope={HotkeyScope.Timeline}
      data-hide-in-print
      className="relative flex h-full flex-1 flex-col @container"
      onClick={() =>
        navigate({
          view,
          entryId: null,
        })
      }
    >
      {entriesIds.length === 0 &&
        !state.isLoading &&
        !state.error &&
        (!feed || feed?.type === "feed") && <AddFeedHelper />}

      <EntryListHeader
        refetch={actions.refetch}
        isRefreshing={isRefreshing}
        hasUpdate={state.hasUpdate}
      />

      <EntryColumnWrapper onScroll={handleCombinedScroll} key={`${routeFeedId}-${view}`}>
        {entriesIds.length === 0 ? (
          state.isLoading ? (
            <EntryItemSkeleton view={view} />
          ) : (
            <EntryEmptyList />
          )
        ) : (
          <ListComponent
            gap={view === FeedViewType.SocialMedia ? 10 : undefined}
            listRef={listRef}
            onRangeChange={handleRangeChange}
            hasNextPage={state.hasNextPage}
            view={view}
            feedId={routeFeedId || ""}
            entriesIds={entriesIds}
            fetchNextPage={fetchNextPage}
            refetch={actions.refetch}
            groupCounts={groupedCounts}
            Footer={
              isCollection ? void 0 : <FooterMarkItem view={view} fetchedTime={state.fetchedTime} />
            }
          />
        )}
      </EntryColumnWrapper>
    </Focusable>
  )
}

function EntryColumnImpl() {
  return (
    <EntryRootStateContext
      value={useMemo(
        () => ({
          isScrolledBeyondThreshold: atom(false),
        }),
        [],
      )}
    >
      <EntryColumnContent />
    </EntryRootStateContext>
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
