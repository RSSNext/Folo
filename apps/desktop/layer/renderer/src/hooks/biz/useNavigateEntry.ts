import { getReadonlyRoute, getStableRouterNavigate } from "@follow/components/atoms/route.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { useSheetContext } from "@follow/components/ui/sheet/context.js"
import type { FeedViewType } from "@follow/constants"
import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { tracker } from "@follow/tracker"
import { nextFrame } from "@follow/utils"
import { useCallback } from "react"
import { toast } from "sonner"

import { disableShowAISummaryOnce } from "~/atoms/ai-summary"
import { disableShowAITranslationOnce } from "~/atoms/ai-translation"
import { setPreviewBackPath } from "~/atoms/preview"
import { resetShowSourceContent } from "~/atoms/source-content"
import {
  ROUTE_ENTRY_PENDING,
  ROUTE_FEED_IN_FOLDER,
  ROUTE_FEED_IN_INBOX,
  ROUTE_FEED_IN_LIST,
  ROUTE_FEED_PENDING,
  ROUTE_TIMELINE_OF_VIEW,
} from "~/constants"

export type NavigateEntryOptions = Partial<{
  timelineId: string
  feedId: string | null
  entryId: string | null
  view: FeedViewType
  folderName: string | null
  inboxId: string
  listId: string
  backPath: string
}>
/**
 * @description a hook to navigate to `feedId`, `entryId`, add search for `view`, `level`
 */
export const useNavigateEntry = () => {
  const sheetContext = useSheetContext()
  const isMobile = useMobile()
  return useCallback(
    (options: NavigateEntryOptions) => {
      navigateEntry(options)
      if (isMobile && sheetContext) {
        sheetContext.dismiss()
      }
    },
    [isMobile, sheetContext],
  )
}

type ParsedNavigateEntryOptions = {
  feedId: string
  timelineId: string
  entryId: string
}

const parseNavigateEntryOptions = (options: NavigateEntryOptions): ParsedNavigateEntryOptions => {
  const { entryId, feedId, view, folderName, inboxId, listId, timelineId } = options || {}
  const route = getReadonlyRoute()
  const { params } = route
  let finalFeedId = feedId || params.feedId || ROUTE_FEED_PENDING
  let finalTimelineId = timelineId || params.timelineId || ROUTE_FEED_PENDING
  const finalEntryId = entryId || ROUTE_ENTRY_PENDING
  const subscription = getSubscriptionByFeedId(finalFeedId)
  const finalView = subscription?.view || view

  if ("feedId" in options && feedId === null) {
    finalFeedId = ROUTE_FEED_PENDING
  }

  if (folderName) {
    finalFeedId = `${ROUTE_FEED_IN_FOLDER}${folderName}`
  }

  if (listId) {
    finalFeedId = `${ROUTE_FEED_IN_LIST}${listId}`
  }

  if (inboxId) {
    finalFeedId = `${ROUTE_FEED_IN_INBOX}${inboxId}`
  }

  finalFeedId = encodeURIComponent(finalFeedId)

  if (finalView !== undefined && !timelineId) {
    finalTimelineId = `${ROUTE_TIMELINE_OF_VIEW}${finalView}`
  }

  return {
    feedId: finalFeedId,
    timelineId: finalTimelineId,
    entryId: finalEntryId,
  }
}

export function getNavigateEntryPath(options: NavigateEntryOptions | ParsedNavigateEntryOptions) {
  if ("feedId" in options) {
    return `/timeline/${options.timelineId}/${options.feedId}/${options.entryId}`
  }

  const { feedId, timelineId, entryId } = parseNavigateEntryOptions(options)

  return `/timeline/${timelineId}/${feedId}/${entryId}`
}

/*
 * /timeline/:timelineId/:feedId/:entryId
 * timelineId: view-1
 * feedId: xxx, folder-xxx, list-xxx, inbox-xxx
 * entryId: xxx
 */
export const navigateEntry = (options: NavigateEntryOptions) => {
  const parsedOptions = parseNavigateEntryOptions(options)
  const path = getNavigateEntryPath(parsedOptions)
  const { backPath } = options || {}
  const route = getReadonlyRoute()
  const currentPath = route.location.pathname + route.location.search
  if (path === currentPath) return

  if (backPath) {
    setPreviewBackPath(backPath)
  }

  tracker.navigateEntry({
    feedId: parsedOptions.feedId,
    entryId: parsedOptions.entryId,
    timelineId: parsedOptions.timelineId,
  })

  disableShowAISummaryOnce()
  disableShowAITranslationOnce()

  nextFrame(() => {
    resetShowSourceContent()
  })

  const navigate = getStableRouterNavigate()

  if (!navigate) {
    const message =
      "Navigation is not available, maybe a mistake in the code, please report an issue. thx."
    toast.error(message)
    throw new Error(message, { cause: "Navigation is not available" })
  }

  return navigate?.(path)
}

export const useBackHome = (timelineId?: string) => {
  const navigate = useNavigateEntry()

  return useCallback(
    (overvideTimelineId?: string) => {
      navigate({ feedId: null, entryId: null, timelineId: overvideTimelineId ?? timelineId })
    },
    [timelineId, navigate],
  )
}
