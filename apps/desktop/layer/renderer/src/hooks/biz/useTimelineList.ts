import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useMemo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"
import { ROUTE_VIEW_ALL } from "~/constants/app"

import { useFeature } from "./useFeature"

export const useTimelineList = (options?: {
  ordered?: boolean
  visible?: boolean
  hidden?: boolean
  withAll?: boolean
}) => {
  const timelineTabs = useUISettingKey("timelineTabs")
  const views = useViewWithSubscription()
  const aiEnabled = useFeature("ai")

  const viewsIds = useMemo(() => {
    const ids = views.map((view) => `view-${view}`)
    if (!options?.ordered) {
      return ids
    }
    const savedVisible = (timelineTabs?.visible ?? []).filter((id) => ids.includes(id))
    const savedHidden = (timelineTabs?.hidden ?? []).filter((id) => ids.includes(id))
    const extra = ids.filter((id) => !savedVisible.includes(id) && !savedHidden.includes(id))

    if (options?.visible) return [...savedVisible, ...extra]
    if (options?.hidden) return [...savedHidden, ...extra]

    const ordered = [...savedVisible, ...savedHidden, ...extra]
    return ordered
  }, [
    options?.hidden,
    options?.ordered,
    options?.visible,
    timelineTabs?.hidden,
    timelineTabs?.visible,
    views,
  ])

  return useMemo(() => {
    const slicedViewsIds = viewsIds.slice(0, 5)
    return options?.withAll && aiEnabled ? [ROUTE_VIEW_ALL, ...slicedViewsIds] : slicedViewsIds
  }, [aiEnabled, options?.withAll, viewsIds])
}
