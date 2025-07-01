import { getFolderFeedsByFeedId } from "@follow/store/subscription/getter"
import { unreadSyncService } from "@follow/store/unread/store"

import { getGeneralSettings } from "~/atoms/settings/general"
import { getRouteParams } from "~/hooks/biz/useRouteParams"

export interface MarkAllFilter {
  startTime: number
  endTime: number
}

export const markAllByRoute = async (
  time?: MarkAllFilter,
  overrideRouterParams?: ReturnType<typeof getRouteParams>,
) => {
  const routerParams = overrideRouterParams || getRouteParams()

  const { feedId, view, inboxId, listId } = routerParams
  const folderIds = getFolderFeedsByFeedId({
    feedId,
    view,
  })

  if (!routerParams) return

  const { hidePrivateSubscriptionsInTimeline: excludePrivate } = getGeneralSettings()
  if (typeof routerParams.feedId === "number" || routerParams.isAllFeeds) {
    unreadSyncService.markBatchAsRead({
      view,
      time,
      excludePrivate,
    })
  } else if (inboxId) {
    unreadSyncService.markBatchAsRead({
      filter: {
        inboxId,
      },
      view,
      time,
      excludePrivate,
    })
  } else if (listId) {
    unreadSyncService.markBatchAsRead({
      filter: {
        listId,
      },
      view,
      time,
      excludePrivate,
    })
  } else if (folderIds?.length) {
    unreadSyncService.markBatchAsRead({
      filter: {
        feedIdList: folderIds,
      },
      view,
      time,
      excludePrivate,
    })
  } else if (routerParams.feedId) {
    unreadSyncService.markBatchAsRead({
      filter: {
        feedIdList: routerParams.feedId?.split(","),
      },
      view,
      time,
      excludePrivate,
    })
  }
}
