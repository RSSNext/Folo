import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useMemo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"

export const useTimelineList = (options?: {
  ordered?: boolean
  visible?: boolean
  hidden?: boolean
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
    const extraHidden = ids.filter((id) => !savedVisible.includes(id) && !savedHidden.includes(id))

    if (options?.visible) return savedVisible
    if (options?.hidden) return [...savedHidden, ...extraHidden]

    const ordered = [...savedVisible, ...savedHidden, ...extraHidden]
    return ordered
  }, [
    options?.hidden,
    options?.ordered,
    options?.visible,
    timelineTabs?.hidden,
    timelineTabs?.visible,
    views,
  ])

  return viewsIds
}
