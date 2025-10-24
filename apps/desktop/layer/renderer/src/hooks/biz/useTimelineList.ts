import { FeedViewType, getViewList } from "@follow/constants"
import { useMemo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"
import { ROUTE_TIMELINE_OF_VIEW, ROUTE_VIEW_ALL } from "~/constants/app"

const DEFAULT_HIDDEN_TIMELINE_IDS = new Set<string>([
  `${ROUTE_TIMELINE_OF_VIEW}${FeedViewType.Audios}`,
  `${ROUTE_TIMELINE_OF_VIEW}${FeedViewType.Notifications}`,
])

export const useTimelineList = (options?: {
  visible?: boolean
  hidden?: boolean
  withAll?: boolean
}) => {
  const timelineTabs = useUISettingKey("timelineTabs")

  const allTimelineIds = useMemo(() => {
    return getViewList({ includeAll: true }).map((view) =>
      view.view === FeedViewType.All ? ROUTE_VIEW_ALL : `${ROUTE_TIMELINE_OF_VIEW}${view.view}`,
    )
  }, [])

  const { visible, hidden } = useMemo(() => {
    const ids = allTimelineIds
    const savedVisible = (timelineTabs?.visible ?? []).filter((id) => ids.includes(id))
    const savedHidden = (timelineTabs?.hidden ?? []).filter((id) => ids.includes(id))
    const extras = ids.filter((id) => !savedVisible.includes(id) && !savedHidden.includes(id))

    let nextVisible = [...savedVisible]
    let nextHidden = [...savedHidden]

    const extraVisible = extras.filter((id) => !DEFAULT_HIDDEN_TIMELINE_IDS.has(id))
    const extraHidden = extras.filter((id) => DEFAULT_HIDDEN_TIMELINE_IDS.has(id))

    const allConfigured =
      savedVisible.includes(ROUTE_VIEW_ALL) || savedHidden.includes(ROUTE_VIEW_ALL)

    if (!allConfigured && extraVisible.includes(ROUTE_VIEW_ALL)) {
      nextVisible = [ROUTE_VIEW_ALL, ...nextVisible]
    }

    nextVisible = [...nextVisible, ...extraVisible.filter((id) => id !== ROUTE_VIEW_ALL)]

    nextHidden = [...nextHidden, ...extraHidden].filter((id) => !nextVisible.includes(id))

    return { visible: nextVisible, hidden: nextHidden }
  }, [allTimelineIds, timelineTabs?.hidden, timelineTabs?.visible])

  return useMemo(() => {
    let result: string[]
    if (options?.visible) result = visible
    else if (options?.hidden) result = hidden
    else result = [...visible, ...hidden]

    if (options?.withAll === false) {
      result = result.filter((id) => id !== ROUTE_VIEW_ALL)
    }

    return result
  }, [hidden, options?.hidden, options?.visible, options?.withAll, visible])
}
