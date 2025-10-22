import { redirect } from "react-router"

import { ROUTE_ENTRY_PENDING, ROUTE_FEED_PENDING, ROUTE_VIEW_ALL } from "~/constants"

export function Component() {
  return null
}

export const loader = () => {
  return redirect(`/timeline/${ROUTE_VIEW_ALL}/${ROUTE_FEED_PENDING}/${ROUTE_ENTRY_PENDING}`)
}
