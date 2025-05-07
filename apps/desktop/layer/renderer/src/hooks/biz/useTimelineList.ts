import { useMemo } from "react"

import { useViewWithSubscription } from "~/store/subscription/hooks"

export const useTimelineList = () => {
  const views = useViewWithSubscription()

  const viewsIds = useMemo(() => views.map((view) => `view-${view}`), [views])

  return viewsIds
}
