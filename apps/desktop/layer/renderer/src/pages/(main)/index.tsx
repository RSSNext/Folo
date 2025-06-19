import { isMobile } from "@follow/components/hooks/useMobile.js"
import { FeedViewType } from "@follow/constants"
import { redirect } from "react-router"

import { getGeneralSettings } from "~/atoms/settings/general"
import { ROUTE_ENTRY_PENDING, ROUTE_FEED_PENDING } from "~/constants"
import { MobileFeedScreen } from "~/modules/app-layout/subscription-column/index"

export function Component() {
  return <MobileFeedScreen />
}

export const loader = () => {
  const mobile = isMobile()
  if (!mobile || getGeneralSettings().startupScreen === "timeline") {
    // navigate to timeline
    return redirect(
      `/timeline/view-${FeedViewType.Articles}/${ROUTE_FEED_PENDING}/${ROUTE_ENTRY_PENDING}`,
    )
  }
  return {}
}
