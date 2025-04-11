import type { FeedViewType } from "@follow/constants"
import { EventBus } from "@follow/utils/src/event-bus"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useId, useMemo, useRef } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Animated, StyleSheet } from "react-native"
import PagerView from "react-native-pager-view"
import { useSharedValue } from "react-native-reanimated"

import { selectTimeline, useSelectedFeed } from "@/src/modules/screen/atoms"
import { useViewWithSubscription } from "@/src/store/subscription/hooks"

import { setHorizontalScrolling } from "./atoms"

const AnimatedPagerView = Animated.createAnimatedComponent<typeof PagerView>(PagerView)

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
    () => activeViews.findIndex((view) => view.view === viewId),
    [activeViews, viewId],
  )

  const pagerRef = useRef<PagerView>(null)

  const rid = useId()
  useEffect(() => {
    return EventBus.subscribe("SELECT_TIMELINE", (data) => {
      if (data.target !== rid) {
        pagerRef.current?.setPage(activeViews.findIndex((view) => view.view === data.view.viewId))
      }
    })
  }, [activeViews, pagerRef, rid])
  const userInitiatedDragRef = useSharedValue(false)

  const pageScrollHandler = useCallback(
    (e: {
      nativeEvent: {
        position: number
        offset: number
      }
    }) => {
      const { position, offset } = e.nativeEvent

      if (!userInitiatedDragRef.value) {
        return
      }

      let targetIndex: number

      if (offset > 0.6 && position < activeViews.length - 1) {
        targetIndex = position + 1
      } else if (offset < 0.4 && position === activeViewIndex - 1) {
        targetIndex = position
      } else if (offset === 0 && position === activeViewIndex) {
        targetIndex = activeViewIndex
      } else {
        targetIndex = activeViewIndex
      }

      if (targetIndex !== activeViewIndex) {
        selectTimeline({ type: "view", viewId: activeViews[targetIndex]!.view }, rid)
        userInitiatedDragRef.value = false
      }
    },
    [activeViewIndex, activeViews, rid, userInitiatedDragRef],
  )

  return (
    <AnimatedPagerView
      testID="pager-view"
      ref={pagerRef}
      style={[styles.PagerView, style]}
      initialPage={activeViewIndex}
      layoutDirection="ltr"
      overdrag
      onPageScroll={pageScrollHandler}
      onPageScrollStateChanged={(e) => {
        if (e.nativeEvent.pageScrollState === "dragging") {
          userInitiatedDragRef.value = true
        }
        setHorizontalScrolling(e.nativeEvent.pageScrollState !== "idle")
        if (e.nativeEvent.pageScrollState === "settling") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      }}
      pageMargin={10}
      orientation="horizontal"
    >
      {useMemo(
        () => activeViews.map((view, index) => renderItem(view.view, index === activeViewIndex)),
        [activeViews, activeViewIndex, renderItem],
      )}
    </AnimatedPagerView>
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
