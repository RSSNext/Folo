import { FeedViewType } from "@follow/constants"
import { useMemo } from "react"

import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import { AI_CHAT_SPECIAL_ID_PREFIX } from "../constants"
import { useMainEntryId } from "./useMainEntryId"

export const getTodayTimelineSummaryId = () => {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  return `${AI_CHAT_SPECIAL_ID_PREFIX.TIMELINE_SUMMARY}${year}-${month}-${day}`
}

export const useTimelineSummarySession = () => {
  const mainEntryId = useMainEntryId()
  const { view, isAllFeeds, entryId } = useRouteParamsSelector((s) => ({
    view: s.view,
    isAllFeeds: s.isAllFeeds,
    entryId: s.entryId,
  }))

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const isAllView = view === FeedViewType.All && isAllFeeds && !realEntryId
  const hasEntryContext = !!mainEntryId
  const canReuseTimelineSummary = isAllView && !hasEntryContext

  const todayTimelineSummaryId = useMemo(() => getTodayTimelineSummaryId(), [])

  return {
    todayTimelineSummaryId,
    canReuseTimelineSummary,
    isAllView,
    hasEntryContext,
  }
}
