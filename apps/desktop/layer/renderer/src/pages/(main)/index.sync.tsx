import { FeedViewType } from "@follow/constants"
import { useSubscriptionStore } from "@follow/store/subscription/store"
import { redirect } from "react-router"

import { getUISettings } from "~/atoms/settings/ui"
import { ROUTE_ENTRY_PENDING, ROUTE_FEED_PENDING, ROUTE_VIEW_ALL } from "~/constants"
import { computeTimelineTabLists } from "~/hooks/biz/useTimelineList"

export function Component() {
  return null
}

export const loader = () => {
  const uiSettings = getUISettings()
  const subscriptionState = useSubscriptionStore.getState()

  const hasAudiosSubscription =
    subscriptionState.feedIdByView[FeedViewType.Audios].size > 0 ||
    subscriptionState.listIdByView[FeedViewType.Audios].size > 0

  const hasNotificationsSubscription =
    subscriptionState.feedIdByView[FeedViewType.Notifications].size > 0 ||
    subscriptionState.listIdByView[FeedViewType.Notifications].size > 0

  const { visible } = computeTimelineTabLists({
    timelineTabs: uiSettings.timelineTabs,
    hasAudiosSubscription,
    hasNotificationsSubscription,
  })

  const firstTimeline = visible[0] ?? ROUTE_VIEW_ALL

  return redirect(`/timeline/${firstTimeline}/${ROUTE_FEED_PENDING}/${ROUTE_ENTRY_PENDING}`)
}
