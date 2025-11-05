import { FeedViewType } from "@follow/constants"

import { ROUTE_ENTRY_PENDING } from "~/constants"
import type { BizRouteParams } from "~/hooks/biz/useRouteParams"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export type TimelineSummaryContextParams = Pick<BizRouteParams, "view" | "entryId">

export const isTimelineSummaryAutoContext = ({ view, entryId }: TimelineSummaryContextParams) => {
  return view === FeedViewType.All && (!entryId || entryId === ROUTE_ENTRY_PENDING)
}

export const useTimelineSummaryAutoContext = () =>
  useRouteParamsSelector(({ view, entryId }) => isTimelineSummaryAutoContext({ view, entryId }))
