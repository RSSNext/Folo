import type { FeedViewType } from "@follow/constants"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { EventBus } from "@follow/utils/event-bus"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Animated, StyleSheet } from "react-native"
import PagerView from "react-native-pager-view"
import { useSharedValue } from "react-native-reanimated"

import { selectTimeline, useSelectedFeed } from "@/src/modules/screen/atoms"

import { PagerListVisibleContext, PagerListWillVisibleContext } from "./PagerListContext"

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
    () => activeViews.indexOf(viewId as FeedViewType),
    [activeViews, viewId],
  )

  const pagerRef = useRef<PagerView>(null)

  const rid = useId()
  useEffect(() => {
    return EventBus.subscribe("SELECT_TIMELINE", (data) => {
      if (data.target !== rid) {
        pagerRef.current?.setPage(activeViews.indexOf(data.view.viewId))
      }
    })
  }, [activeViews, pagerRef, rid])
  const userInitiatedDragRef = useSharedValue(false)

  const [dragging, setDragging] = useState(false)
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
        selectTimeline({ type: "view", viewId: activeViews[targetIndex]! }, rid)
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
      offscreenPageLimit={3}
      overdrag
      onPageScroll={pageScrollHandler}
      onPageScrollStateChanged={(e) => {
        const { pageScrollState } = e.nativeEvent
        if (pageScrollState === "dragging") {
          setDragging(true)
          userInitiatedDragRef.value = true
        } else if (pageScrollState === "idle") {
          setDragging(false)
        }

        if (pageScrollState === "settling") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      }}
      pageMargin={100}
      orientation="horizontal"
    >
      {useMemo(
        () =>
          activeViews.map((view, index) => (
            <PagerListVisibleContext value={index === activeViewIndex} key={view}>
              <PagerListWillVisibleContext
                value={(index === activeViewIndex + 1 || index === activeViewIndex - 1) && dragging}
              >
                {renderItem(view, index === activeViewIndex)}
              </PagerListWillVisibleContext>
            </PagerListVisibleContext>
          )),
        [activeViews, activeViewIndex, dragging, renderItem],
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
