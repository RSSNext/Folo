import { FeedViewType } from "@follow/constants"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useMemo } from "react"

import { useFeature } from "~/hooks/biz/useFeature"

export const useTimelineList = () => {
  const views = useViewWithSubscription()

  // because the All view is highly tied to the AI
  // so we need to filter it out if the AI is not enabled
  const aiEnabled = useFeature("ai")

  const filteredViews = useMemo(
    () => (aiEnabled ? views : views.filter((v) => v !== FeedViewType.All)),
    [views, aiEnabled],
  )

  const viewsIds = useMemo(() => filteredViews.map((view) => `view-${view}`), [filteredViews])

  return viewsIds
}
