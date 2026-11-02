import { FeedViewType } from "@follow/constants"
import { useWhoami } from "@follow/store/user/hooks"
import type { FlashListRef } from "@shopify/flash-list"
import { use, useCallback, useEffect, useRef, useState } from "react"

import { useEffectiveEntrySortOrder, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { withErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { ListErrorView } from "@/src/components/errors/ListErrorView"
import {
  useBottomTabBarHeight,
  useRegisterNavigationScrollView,
} from "@/src/components/layouts/tabbar/hooks"
import {
  EntryListSourceContext,
  useEntryListSourceValue,
} from "@/src/modules/entry-content/entry-navigation/entry-list-source"
import { EntryListContentPicture } from "@/src/modules/entry-list/EntryListContentPicture"
import { EntrySplitContext } from "@/src/modules/entry-split/context"

import { useEntries, useEntryListContext, useIsTimelineEntrySource } from "../screen/atoms"
import { useHeaderHeight } from "../screen/hooks/useHeaderHeight"
import { shouldSuspendMarkReadForScrollReset } from "../screen/scroll-reset"
import { EntryListContentArticle } from "./EntryListContentArticle"
import { EntryListContentSocial } from "./EntryListContentSocial"
import { EntryListContentVideo } from "./EntryListContentVideo"

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
  const isTimelineSource = useIsTimelineEntrySource()
  const sortOrder = useEffectiveEntrySortOrder({ isTimelineSource })
  useEffect(() => {
    requestScrollToTop()
  }, [requestScrollToTop, sortOrder, unreadOnly])

  const { isReady, hasNextPage, fetchNextPage } = useEntries({ viewId, active })
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

  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const isNextToReader = !!use(EntrySplitContext)
  const entryListSource = useEntryListSourceValue({
    entryIds,
    hasNextPage,
    fetchNextPage,
    // The reader keeps the list on the entry it moved to, so going back shows that one
    revealEntry: useCallback(
      (entryId: string) => {
        const index = entryIds?.indexOf(entryId) ?? -1
        const list = ref.current
        if (index === -1 || !list) return
        // Next to the reader the list stays in view, so it scrolls only as far as the row needs
        const layout = isNextToReader ? list.getLayout(index) : undefined
        if (layout) {
          const offset = list.getAbsoluteLastScrollOffset()
          const top = list.getFirstItemOffset() + layout.y
          const bottom = top + layout.height
          const visibleHeight = list.getWindowSize().height
          if (top < offset + headerHeight) {
            list.scrollToOffset({ offset: top - headerHeight, animated: true })
          } else if (bottom > offset + visibleHeight - tabBarHeight) {
            list.scrollToOffset({ offset: bottom - visibleHeight + tabBarHeight, animated: true })
          }
          return
        }
        list.scrollToIndex({
          index,
          animated: false,
          // FlashList adds the offset to the scroll position, so a negative one puts the entry
          // below the header that covers the top of the list
          viewOffset: -headerHeight,
        })
      },
      [entryIds, headerHeight, isNextToReader, ref, tabBarHeight],
    ),
  })

  return (
    <EntryListSourceContext value={entryListSource}>
      <ContentComponent
        ref={ref}
        entryIds={entryIds}
        active={active}
        view={viewId}
        onResetScrollSignalConsumed={handleResetScrollSignalConsumed}
        resetScrollSignal={resetScrollSignal}
        suspendMarkRead={isScrollResetPending}
      />
    </EntryListSourceContext>
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
