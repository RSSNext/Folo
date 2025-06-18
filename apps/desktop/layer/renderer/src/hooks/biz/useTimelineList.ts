import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useMemo } from "react"

export const useTimelineList = () => {
  const views = useViewWithSubscription()

  const viewsIds = useMemo(() => views.map((view) => `view-${view}`), [views])

  return viewsIds
}
