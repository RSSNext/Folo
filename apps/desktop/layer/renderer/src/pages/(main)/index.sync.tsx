import { FeedViewType } from "@follow/constants"
import { redirect } from "react-router"

import { ROUTE_ENTRY_PENDING, ROUTE_FEED_PENDING } from "~/constants"
import { getFeature } from "~/hooks/biz/useFeature"

export function Component() {
  return null
}

export const loader = () => {
  const aiEnabled = getFeature("ai")
  const view = aiEnabled ? FeedViewType.All : FeedViewType.Articles
  return redirect(`/timeline/view-${view}/${ROUTE_FEED_PENDING}/${ROUTE_ENTRY_PENDING}`)
}
