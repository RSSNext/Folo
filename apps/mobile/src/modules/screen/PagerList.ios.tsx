import type { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { EventBus } from "@follow/utils/event-bus"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"

import { PagerView } from "@/src/components/native/PagerView"
import type { PagerRef } from "@/src/components/native/PagerView/specs"

import { selectTimeline, useSelectedFeed } from "./atoms"
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
  useEffect(() => {
    return EventBus.subscribe("SELECT_TIMELINE", (data) => {
      if (data.target !== rid) {
        pagerRef.current?.setPage(activeViews.indexOf(data.view.viewId))
      }
    })
  }, [activeViews, pagerRef, rid])
  const [dragging, setDragging] = useState(false)

  return (
    <PagerView
      ref={pagerRef}
      initialPageIndex={initialPageIndex}
      onScrollBegin={useCallback(() => setDragging(true), [])}
      onScrollEnd={useCallback(() => setDragging(false), [])}
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
        (index) => (
          <PagerListVisibleContext value={index === activeViewIndex} key={activeViews[index]!}>
            <PagerListWillVisibleContext
              value={(index === activeViewIndex + 1 || index === activeViewIndex - 1) && dragging}
            >
              {renderItem(activeViews[index]!, index === activeViewIndex)}
            </PagerListWillVisibleContext>
          </PagerListVisibleContext>
        ),
        [activeViews, activeViewIndex, dragging, renderItem],
      )}
      pageTotal={activeViews.length}
    />
  )
}
