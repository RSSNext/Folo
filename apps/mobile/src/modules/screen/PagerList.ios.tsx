import type { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { EventBus } from "@follow/utils/event-bus"
import * as Haptics from "expo-haptics"
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Freeze } from "react-freeze"
import type { StyleProp, ViewStyle } from "react-native"
import { clamp, withTiming } from "react-native-reanimated"

import { PagerView } from "@/src/components/native/PagerView"
import type { PagerRef } from "@/src/components/native/PagerView/specs"

import { selectTimeline, useSelectedFeed, useTimelineSelectorDragProgress } from "./atoms"
import { PagerListVisibleContext, PagerListWillVisibleContext } from "./PagerListContext"

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
  const [initialPageIndex] = useState(activeViewIndex)
  const pagerRef = useRef<PagerRef>(null)
  const rid = useId()
  const dragProgress = useTimelineSelectorDragProgress()

  useLayoutEffect(() => {
    return EventBus.subscribe("SELECT_TIMELINE", (data) => {
      if (data.target !== rid) {
        const targetIndex = activeViews.indexOf(data.view.viewId)
        pagerRef.current?.setPage(targetIndex)
        dragProgress.set(withTiming(targetIndex))
      }
    })
  }, [activeViews, dragProgress, pagerRef, rid])
  const [dragging, setDragging] = useState(false)

  return (
    <PagerView
      ref={pagerRef}
      initialPageIndex={initialPageIndex}
      onScroll={(percent, direction, position) => {
        if (!dragging) return
        const progress = clamp(
          percent * (direction === "left" ? -1 : direction === "right" ? 1 : 0) + position,
          0,
          activeViews.length - 1,
        )
        dragProgress.set(progress)
      }}
      onScrollBegin={useCallback(() => setDragging(true), [])}
      onScrollEnd={useCallback(
        (index: number) => {
          setDragging(false)
          dragProgress.set(withTiming(index))
        },
        [dragProgress],
      )}
      pageContainerClassName="flex-1"
      containerClassName="flex-1 absolute inset-0"
      containerStyle={style}
      onPageChange={useTypeScriptHappyCallback(
        (targetIndex) => {
          selectTimeline({ type: "view", viewId: activeViews[targetIndex]! }, rid)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        [activeViews, rid],
      )}
      renderPage={useTypeScriptHappyCallback(
        (index) => {
          const isActive = index === activeViewIndex
          const willVisible =
            (index === activeViewIndex + 1 || index === activeViewIndex - 1) && dragging
          const freeze = !(isActive || willVisible)
          return (
            <PagerListVisibleContext value={isActive} key={activeViews[index]!}>
              <PagerListWillVisibleContext value={willVisible}>
                <Freeze freeze={freeze}>{renderItem(activeViews[index]!, isActive)}</Freeze>
              </PagerListWillVisibleContext>
            </PagerListVisibleContext>
          )
        },

        [activeViews, activeViewIndex, dragging, renderItem],
      )}
      pageTotal={activeViews.length}
    />
  )
}
