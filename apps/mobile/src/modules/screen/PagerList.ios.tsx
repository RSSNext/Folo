import type { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { EventBus } from "@follow/utils/src/event-bus"
import * as Haptics from "expo-haptics"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"

import { PagerView } from "@/src/components/native/PagerView"
import type { PagerRef } from "@/src/components/native/PagerView/specs"
import { useViewWithSubscription } from "@/src/store/subscription/hooks"

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
    () => activeViews.findIndex((view) => view.view === viewId),
    [activeViews, viewId],
  )
  const pagerRef = useRef<PagerRef>(null)
  const rid = useId()
  useEffect(() => {
    return EventBus.subscribe("SELECT_TIMELINE", (data) => {
      if (data.target !== rid) {
        pagerRef.current?.setPage(activeViews.findIndex((view) => view.view === data.view.viewId))
      }
    })
  }, [activeViews, pagerRef, rid])
  const [dragging, setDragging] = useState(false)

  return (
    <PagerView
      ref={pagerRef}
      initialPageIndex={activeViewIndex}
      onScrollBegin={() => setDragging(true)}
      onScrollEnd={() => setDragging(false)}
      pageContainerClassName="flex-1"
      containerClassName="flex-1 absolute inset-0"
      containerStyle={style}
      onPageChange={(targetIndex) => {
        selectTimeline({ type: "view", viewId: activeViews[targetIndex]!.view }, rid)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }}
      renderPage={useTypeScriptHappyCallback(
        (index) => (
          <PagerListVisibleContext.Provider
            value={index === activeViewIndex}
            key={activeViews[index]!.view}
          >
            <PagerListWillVisibleContext.Provider
              value={(index === activeViewIndex + 1 || index === activeViewIndex - 1) && dragging}
            >
              {renderItem(activeViews[index]!.view, index === activeViewIndex)}
            </PagerListWillVisibleContext.Provider>
          </PagerListVisibleContext.Provider>
        ),
        [activeViews, activeViewIndex, dragging, renderItem],
      )}
      pageTotal={activeViews.length}
    />
  )
}
