import type { FeedViewType } from "@follow/constants"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { EventBus } from "@follow/utils/event-bus"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { StyleSheet, View } from "react-native"
import type {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEventData,
  PageScrollStateChangedNativeEventData,
} from "react-native-pager-view"
import PagerView from "react-native-pager-view"
import Animated, { runOnJS, useEvent, useHandler } from "react-native-reanimated"

import { selectTimeline, useSelectedFeed, useTimelineSelectorDragProgress } from "./atoms"
import { PagerListVisibleContext, PagerListWillVisibleContext } from "./PagerListContext"

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

const handlePageSelected = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
}

export function PagerList({
  renderItem,
  style,
}: {
  renderItem: (view: FeedViewType, active: boolean) => React.ReactNode
  style?: StyleProp<ViewStyle> | undefined
}) {
  const selectedFeed = useSelectedFeed()
  const viewId = selectedFeed?.type === "view" ? selectedFeed.viewId : undefined

  const activeViews = useViewWithSubscription()

  const activeViewIndex = useMemo(
    () => activeViews.indexOf(viewId as FeedViewType),
    [activeViews, viewId],
  )
  const dragProgress = useTimelineSelectorDragProgress()

  const pagerRef = useRef<PagerView>(null)

  const rid = useId()
  useEffect(() => {
    return EventBus.subscribe("SELECT_TIMELINE", (data) => {
      if (data.target !== rid) {
        pagerRef.current?.setPage(activeViews.indexOf(data.view.viewId))
      }
    })
  }, [activeViews, pagerRef, rid])

  const onPageSelectedJS = useCallback(
    (view: FeedViewType) => {
      selectTimeline({ type: "view", viewId: view }, rid)
    },
    [rid],
  )

  // Android mounts a new pager with Home on every tab switch, which can open on another page
  // than `initialPage` and report only that selection: start the selector, which outlives the
  // pager, from the page it should open on, and send the pager there
  const [initialPage] = useState(activeViewIndex)
  useEffect(() => {
    if (initialPage < 0) return
    dragProgress.set(initialPage)
    pagerRef.current?.setPageWithoutAnimation(initialPage)
  }, [dragProgress, initialPage])

  const handlePageScroll = usePagerHandlers(
    {
      onPageScroll(e: PagerViewOnPageScrollEventData) {
        "worklet"
        const { position, offset } = e
        dragProgress.set(offset + position)
      },
      onPageSelected(e: PagerViewOnPageSelectedEventData) {
        "worklet"
        // A selection can come without scroll events, and the selector only reads the progress
        dragProgress.set(e.position)
        const view = activeViews[e.position]
        if (view !== undefined) {
          runOnJS(onPageSelectedJS)(view)
        }
      },
    },
    [activeViews, dragProgress, onPageSelectedJS],
  )

  return (
    <AnimatedPagerView
      testID="pager-view"
      ref={pagerRef}
      style={[styles.PagerView, style]}
      initialPage={activeViewIndex}
      layoutDirection="ltr"
      offscreenPageLimit={1}
      overdrag
      onPageScroll={handlePageScroll}
      onPageSelected={handlePageSelected}
      orientation="horizontal"
    >
      {useMemo(
        () =>
          activeViews.map((view, index) => {
            const isActive = index === activeViewIndex
            const willVisible = index === activeViewIndex + 1 || index === activeViewIndex - 1
            if (!isActive && !willVisible) {
              return <View key={view} />
            }
            return (
              <PagerListVisibleContext value={isActive} key={view}>
                <PagerListWillVisibleContext value={willVisible}>
                  {renderItem(view, isActive)}
                </PagerListWillVisibleContext>
              </PagerListVisibleContext>
            )
          }),
        [activeViews, activeViewIndex, renderItem],
      )}
    </AnimatedPagerView>
  )
}

/**
 * Ported from bluesky-social/social-app
 * https://github.com/bluesky-social/social-app/blob/bf95345b333c56876cabf4c5b8516c431cc8ce9b/src/view/com/pager/Pager.tsx#L159-L190
 */
function usePagerHandlers(
  handlers: {
    onPageScroll: (e: PagerViewOnPageScrollEventData) => void
    onPageScrollStateChanged?: (e: PageScrollStateChangedNativeEventData) => void
    onPageSelected?: (e: PagerViewOnPageSelectedEventData) => void
  },
  dependencies: unknown[],
) {
  const { doDependenciesDiffer } = useHandler(handlers as any, dependencies)
  const subscribeForEvents = ["onPageScroll", "onPageScrollStateChanged", "onPageSelected"]
  return useEvent(
    (event) => {
      "worklet"
      const { onPageScroll, onPageScrollStateChanged, onPageSelected } = handlers
      if (event.eventName.endsWith("onPageScroll")) {
        onPageScroll(event as any as PagerViewOnPageScrollEventData)
      } else if (event.eventName.endsWith("onPageScrollStateChanged")) {
        onPageScrollStateChanged?.(event as any as PageScrollStateChangedNativeEventData)
      } else if (event.eventName.endsWith("onPageSelected")) {
        onPageSelected?.(event as any as PagerViewOnPageSelectedEventData)
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  PagerView: {
    flex: 1,
  },
})
