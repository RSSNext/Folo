import type { FeedViewType } from "@follow/constants"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { EventBus } from "@follow/utils/event-bus"
import * as Haptics from "expo-haptics"
import { useEffect, useId, useMemo, useRef } from "react"
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

  const handlePageScroll = usePagerHandlers(
    {
      onPageScroll(e: PagerViewOnPageScrollEventData) {
        "worklet"
        const { position, offset } = e
        dragProgress.set(offset + position)
      },
      onPageScrollStateChanged(e: PageScrollStateChangedNativeEventData) {
        "worklet"
        const { pageScrollState } = e
        if (pageScrollState === "dragging") {
          // setDragging(true)
        } else if (pageScrollState === "idle") {
          // setDragging(false)
        }

        if (pageScrollState === "settling") {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light)
        }
      },
      onPageSelected(e: PagerViewOnPageSelectedEventData) {
        "worklet"
        runOnJS(selectTimeline)({ type: "view", viewId: activeViews[e.position]! }, rid)
      },
    },
    [],
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
    onPageScrollStateChanged: (e: PageScrollStateChangedNativeEventData) => void
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
        onPageScrollStateChanged(event as any as PageScrollStateChangedNativeEventData)
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
