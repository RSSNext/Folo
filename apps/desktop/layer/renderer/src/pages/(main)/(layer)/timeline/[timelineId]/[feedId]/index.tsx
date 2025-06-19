import { isMobile } from "@follow/components/hooks/useMobile.js"
import { redirect } from "react-router"

import { ROUTE_ENTRY_PENDING } from "~/constants"
import { MobileCenterColumnScreen } from "~/modules/app-layout/timeline-column/index"

export const Component = () => {
  return <MobileCenterColumnScreen />
}
export const loader = ({ request }: { request: Request; params: { feedId: string } }) => {
  const url = new URL(request.url)
  const mobile = isMobile()
  if (!mobile) {
    return redirect(`${url.pathname}/${ROUTE_ENTRY_PENDING}`)
  }
  return {}
}
