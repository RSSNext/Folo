import type { FeedViewType } from "@follow/constants"

import { ROUTE_TIMELINE_OF_VIEW } from "~/constants"

import { FeedList } from "./FeedList"

export default function TimelineList({ timelineId }: { timelineId: string }) {
  if (timelineId.startsWith(ROUTE_TIMELINE_OF_VIEW)) {
    const id = Number.parseInt(timelineId.slice(ROUTE_TIMELINE_OF_VIEW.length), 10) as FeedViewType
    return <FeedList className="flex size-full flex-col text-sm" view={id} />
  }
}
