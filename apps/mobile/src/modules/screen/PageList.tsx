import type { FeedViewType } from "@follow/constants"
import * as Haptics from "expo-haptics"
import { useEffect, useMemo } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Animated, StyleSheet } from "react-native"
import PagerView from "react-native-pager-view"

import { selectTimeline, useSelectedFeed } from "@/src/modules/screen/atoms"
import { useViewWithSubscription } from "@/src/store/subscription/hooks"

import { setHorizontalScrolling } from "./atoms"
import { usePagerView } from "./usePagerView"

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
  const viewIdIndex = activeViews.findIndex((view) => view.view === viewId)
  const { page, pagerRef, ...rest } = usePagerView({
    initialPage: viewIdIndex,
    onIndexChange: (index) => {
      selectTimeline({ type: "view", viewId: activeViews[index]!.view })
    },
  })

  useEffect(() => {
    if (page === viewIdIndex) return
    pagerRef.current?.setPage(viewIdIndex)
  }, [page, pagerRef, viewIdIndex])

  return (
    <AnimatedPagerView
      testID="pager-view"
      ref={pagerRef}
      style={[styles.PagerView, style]}
      initialPage={page}
      layoutDirection="ltr"
      overdrag
      onPageScroll={rest.onPageScroll}
      onPageSelected={rest.onPageSelected}
      onPageScrollStateChanged={(e) => {
        rest.onPageScrollStateChanged(e)
        setHorizontalScrolling(e.nativeEvent.pageScrollState !== "idle")
        if (e.nativeEvent.pageScrollState === "settling") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      }}
      pageMargin={10}
      orientation="horizontal"
    >
      {useMemo(
        () => activeViews.map((view, index) => renderItem(view.view, page === index)),
        [activeViews, page, renderItem],
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
