import { FeedViewType } from "@follow/constants"
import { redirect } from "react-router"

import {
  ROUTE_ENTRY_PENDING,
  ROUTE_FEED_PENDING,
  ROUTE_TIMELINE_OF_VIEW,
  ROUTE_VIEW_ALL,
} from "~/constants"
import { getFeature } from "~/hooks/biz/useFeature"

export function Component() {
  return null
}

export const loader = () => {
  const aiEnabled = getFeature("ai")
  return redirect(
    `/timeline/${aiEnabled ? ROUTE_VIEW_ALL : `${ROUTE_TIMELINE_OF_VIEW}${FeedViewType.Articles}`}/${ROUTE_FEED_PENDING}/${ROUTE_ENTRY_PENDING}`,
  )
}
