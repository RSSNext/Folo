import { Outlet, redirect } from "react-router"

import { getTimelineIdByView, parseView } from "~/hooks/biz/useRouteParams"

export const loader = ({
  params,
  request,
}: {
  params: { timelineId?: string }
  request: Request
}) => {
  const { timelineId } = params
  if (!timelineId) return null

  const view = parseView(timelineId)
  if (view === undefined) return null

  const canonicalTimelineId = getTimelineIdByView(view)

  if (canonicalTimelineId === timelineId) return null

  const url = new URL(request.url)
  const segments = url.pathname.split("/")
  const timelineIndex = segments.indexOf("timeline")

  if (timelineIndex !== -1 && segments[timelineIndex + 1]) {
    segments[timelineIndex + 1] = canonicalTimelineId
    const nextPathname = segments.join("/") || "/"
    const nextUrl = `${nextPathname}${url.search}${url.hash}`
    return redirect(nextUrl)
  }

  return redirect(`/timeline/${canonicalTimelineId}${url.search}${url.hash}`)
}

export const Component = () => {
  return <Outlet />
}
