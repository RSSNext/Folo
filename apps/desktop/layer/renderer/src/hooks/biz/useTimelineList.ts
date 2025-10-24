import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useMemo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"
import { ROUTE_VIEW_ALL } from "~/constants/app"

export const useTimelineList = (options?: {
  ordered?: boolean
  visible?: boolean
  hidden?: boolean
  withAll?: boolean
}) => {
  const timelineTabs = useUISettingKey("timelineTabs")
  const views = useViewWithSubscription()

  const viewsIds = useMemo(() => {
    const ids = views.map((view) => `view-${view}`)
    if (!options?.ordered) {
      return ids
    }
    const savedVisible = (timelineTabs?.visible ?? []).filter((id) => ids.includes(id))
    const savedHidden = (timelineTabs?.hidden ?? []).filter((id) => ids.includes(id))
    const extra = ids.filter((id) => !savedVisible.includes(id) && !savedHidden.includes(id))

    const visible = [...savedVisible, ...extra]
    if (options?.visible) return visible
    const hidden = [...savedHidden, ...extra].filter((id) => !visible.includes(id))
    if (options?.hidden) return hidden

    const ordered = [...visible, ...hidden]
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
    return options?.withAll ? [ROUTE_VIEW_ALL, ...viewsIds] : viewsIds
  }, [options?.withAll, viewsIds])
}
