import { FeedViewType } from "@follow/constants"
import { useWhoami } from "@follow/store/user/hooks"
import type { FlashListRef } from "@shopify/flash-list"
import type { RefObject } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { withErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { ListErrorView } from "@/src/components/errors/ListErrorView"
import { useRegisterNavigationScrollView } from "@/src/components/layouts/tabbar/hooks"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { EntryListContentPicture } from "@/src/modules/entry-list/EntryListContentPicture"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

import { useEntries, useEntryListContext } from "../screen/atoms"
import { shouldSuspendMarkReadForScrollReset } from "../screen/scroll-reset"
import { EntryListContentArticle } from "./EntryListContentArticle"
import { EntryListContentSocial } from "./EntryListContentSocial"
import { EntryListContentVideo } from "./EntryListContentVideo"
import { shouldScrollEntryListToTopOnRefreshStateChange } from "./refresh-reset"

const NoLoginGuard = ({ children }: { children: React.ReactNode }) => {
  const whoami = useWhoami()
  const screenType = useEntryListContext().type

  if (whoami || screenType !== "subscriptions") {
    return children
  }

  return <NoLoginInfo target="subscriptions" />
}

type EntryListSelectorProps = {
  entryIds: string[] | null
  viewId: FeedViewType
  active?: boolean
}

function EntryListSelectorImpl({ entryIds, viewId, active = true }: EntryListSelectorProps) {
  const ref = useRegisterNavigationScrollView<FlashListRef<any>>(active)
  const [resetScrollSignal, setResetScrollSignal] = useState<number>()
  const [appliedResetScrollSignal, setAppliedResetScrollSignal] = useState<number>()
  const isScrollResetPending = shouldSuspendMarkReadForScrollReset({
    resetSignal: resetScrollSignal,
    appliedResetSignal: appliedResetScrollSignal,
  })
  const requestScrollToTop = useCallback(() => {
    setResetScrollSignal((signal) => (signal ?? 0) + 1)
  }, [])
  const handleResetScrollSignalConsumed = useCallback((signal: number) => {
    setAppliedResetScrollSignal((currentSignal) =>
      currentSignal === signal ? currentSignal : signal,
    )
  }, [])

  let ContentComponent:
    | typeof EntryListContentSocial
    | typeof EntryListContentPicture
    | typeof EntryListContentVideo
    | typeof EntryListContentArticle = EntryListContentArticle
  switch (viewId) {
    case FeedViewType.SocialMedia: {
      ContentComponent = EntryListContentSocial
      break
    }
    case FeedViewType.Pictures: {
      ContentComponent = EntryListContentPicture
      break
    }
    case FeedViewType.Videos: {
      ContentComponent = EntryListContentVideo
      break
    }
    case FeedViewType.Articles: {
      ContentComponent = EntryListContentArticle
      break
    }
  }

  const unreadOnly = useGeneralSettingKey("unreadOnly")
  useEffect(() => {
    requestScrollToTop()
  }, [requestScrollToTop, unreadOnly])

  const { isFetching, isFetchingNextPage, isReady } = useEntries({ viewId, active })
  const isRefreshing = isFetching && !isFetchingNextPage
  const wasRefreshingRef = useRef(isRefreshing)
  useEffect(() => {
    if (!active) return

    const wasRefreshing = wasRefreshingRef.current
    wasRefreshingRef.current = isRefreshing

    if (
      !shouldScrollEntryListToTopOnRefreshStateChange({
        wasRefreshing,
        isRefreshing,
      })
    ) {
      return
    }

    requestScrollToTop()
  }, [active, isRefreshing, requestScrollToTop])

  const hasResetAfterReadyRef = useRef(false)
  useEffect(() => {
    if (!active) return
    if (!isReady) {
      hasResetAfterReadyRef.current = false
      return
    }
    if (!entryIds?.length) return
    if (hasResetAfterReadyRef.current) return

    requestScrollToTop()
    hasResetAfterReadyRef.current = true
  }, [active, entryIds, isReady, requestScrollToTop, viewId])

  useEffect(() => {
    if (!active) return

    requestScrollToTop()
  }, [active, requestScrollToTop, viewId])

  useAutoScrollToEntryAfterPullUpToNext(ref, entryIds || [])

  return (
    <ContentComponent
      ref={ref}
      entryIds={entryIds}
      active={active}
      view={viewId}
      onResetScrollSignalConsumed={handleResetScrollSignalConsumed}
      resetScrollSignal={resetScrollSignal}
      suspendMarkRead={isScrollResetPending}
    />
  )
}

export const EntryListSelector = withErrorBoundary(
  ({ entryIds, viewId, active }: EntryListSelectorProps) => {
    return (
      <NoLoginGuard>
        <EntryListSelectorImpl entryIds={entryIds} viewId={viewId} active={active} />
      </NoLoginGuard>
    )
  },
  ListErrorView,
)

const useAutoScrollToEntryAfterPullUpToNext = (
  ref: RefObject<FlashListRef<any> | null>,
  entryIds: string[],
) => {
  const navigation = useNavigation()
  useEffect(() => {
    return navigation.on("screenChange", (payload) => {
      if (!payload.route) return
      if (payload.type !== "appear") return
      if (payload.route.Component !== EntryDetailScreen) return
      if (payload.route.screenOptions?.stackAnimation !== "fade_from_bottom") return
      const nextEntryId =
        payload.route.props &&
        typeof payload.route.props === "object" &&
        "entryId" in payload.route.props &&
        typeof payload.route.props.entryId === "string"
          ? payload.route.props.entryId
          : undefined
      const idx = nextEntryId ? (entryIds?.indexOf(nextEntryId || "") ?? -1) : -1
      if (idx === -1) return
      ref?.current?.scrollToIndex({
        index: idx,
        animated: false,
        viewOffset: 70,
      })
    })
  }, [entryIds, navigation, ref])
}
