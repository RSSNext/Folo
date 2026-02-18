import { FeedViewType, getViewList } from "@follow/constants"
import type { UISettings } from "@follow/shared/settings/interface"
import { useSubscriptionStore } from "@follow/store/subscription/store"
import { useMemo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"
import { ROUTE_VIEW_ALL } from "~/constants/app"

import { getTimelineIdByView, parseView } from "./useRouteParams"

const ALL_TIMELINE_IDS = getViewList({ includeAll: true }).map((view) =>
  getTimelineIdByView(view.view),
)

const normalizeTimelineId = (id: string) => {
  const view = parseView(id)
  return view !== undefined ? getTimelineIdByView(view) : id
}

const filterKnownTimelineIds = (ids: string[]) => {
  const seen = new Set<string>()
  return ids.filter((id) => {
    if (!ALL_TIMELINE_IDS.includes(id)) return false
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export const computeTimelineTabLists = ({
  timelineTabs,
  hasAudiosSubscription,
  hasNotificationsSubscription,
}: {
  timelineTabs?: UISettings["timelineTabs"]
  hasAudiosSubscription: boolean
  hasNotificationsSubscription: boolean
}) => {
  const savedVisible = filterKnownTimelineIds(
    (timelineTabs?.visible ?? []).map(normalizeTimelineId),
  )
  const savedHidden = filterKnownTimelineIds((timelineTabs?.hidden ?? []).map(normalizeTimelineId))
  const extras = ALL_TIMELINE_IDS.filter(
    (id) => !savedVisible.includes(id) && !savedHidden.includes(id),
  )

  const isDefaultHidden = (id: string) => {
    if (id === getTimelineIdByView(FeedViewType.Audios)) return !hasAudiosSubscription
    if (id === getTimelineIdByView(FeedViewType.Notifications)) return !hasNotificationsSubscription
    return false
  }

  const extraVisible = extras.filter((id) => !isDefaultHidden(id))
  const extraHidden = extras.filter((id) => isDefaultHidden(id))

  const allConfigured =
    savedVisible.includes(ROUTE_VIEW_ALL) || savedHidden.includes(ROUTE_VIEW_ALL)

  let nextVisible = [...savedVisible]

  if (!allConfigured && extraVisible.includes(ROUTE_VIEW_ALL)) {
    nextVisible = [ROUTE_VIEW_ALL, ...nextVisible]
  }

  nextVisible = [...nextVisible, ...extraVisible.filter((id) => id !== ROUTE_VIEW_ALL)]

  const nextHidden = [...savedHidden, ...extraHidden].filter((id) => !nextVisible.includes(id))

  return { visible: nextVisible, hidden: nextHidden }
}

export const useTimelineList = (options?: {
  visible?: boolean
  hidden?: boolean
  withAll?: boolean
}) => {
  const timelineTabs = useUISettingKey("timelineTabs")
  const hasAudiosSubscription = useSubscriptionStore(
    (state) =>
      state.feedIdByView[FeedViewType.Audios].size > 0 ||
      state.listIdByView[FeedViewType.Audios].size > 0,
  )
  const hasNotificationsSubscription = useSubscriptionStore(
    (state) =>
      state.feedIdByView[FeedViewType.Notifications].size > 0 ||
      state.listIdByView[FeedViewType.Notifications].size > 0,
  )

  const { visible, hidden } = useMemo(
    () =>
      computeTimelineTabLists({
        timelineTabs,
        hasAudiosSubscription,
        hasNotificationsSubscription,
      }),
    [hasAudiosSubscription, hasNotificationsSubscription, timelineTabs],
  )

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
