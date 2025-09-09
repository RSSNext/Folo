import { FeedViewType } from "@follow/constants"
import { redirect } from "react-router"

import { ROUTE_ENTRY_PENDING, ROUTE_FEED_PENDING } from "~/constants"

export function Component() {
  return null
}

export const loader = () => {
  return redirect(
    `/timeline/view-${FeedViewType.Articles}/${ROUTE_FEED_PENDING}/${ROUTE_ENTRY_PENDING}`,
  )
}
