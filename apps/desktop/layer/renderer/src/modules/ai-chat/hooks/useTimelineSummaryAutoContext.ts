import { FeedViewType } from "@follow/constants"

import { ROUTE_ENTRY_PENDING, ROUTE_FEED_PENDING } from "~/constants"
import type { BizRouteParams } from "~/hooks/biz/useRouteParams"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export type TimelineSummaryContextParams = Pick<BizRouteParams, "view" | "entryId" | "feedId">

export const isTimelineSummaryAutoContext = ({
  view,
  feedId,
  entryId,
}: TimelineSummaryContextParams) => {
  return (
    view === FeedViewType.All &&
    (!entryId || entryId === ROUTE_ENTRY_PENDING) &&
    (!feedId || feedId === ROUTE_FEED_PENDING)
  )
}

export const useTimelineSummaryAutoContext = () =>
  useRouteParamsSelector(({ view, feedId, entryId }) =>
    isTimelineSummaryAutoContext({ view, feedId, entryId }),
  )
