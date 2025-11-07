import { ROUTE_ENTRY_PENDING } from "~/constants"
import type { BizRouteParams } from "~/hooks/biz/useRouteParams"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export type TimelineSummaryContextParams = Pick<BizRouteParams, "entryId">

export const isTimelineSummaryAutoContext = ({ entryId }: TimelineSummaryContextParams) => {
  return !entryId || entryId === ROUTE_ENTRY_PENDING
}

export const useTimelineSummaryAutoContext = () =>
  useRouteParamsSelector(({ entryId }) => isTimelineSummaryAutoContext({ entryId }))
