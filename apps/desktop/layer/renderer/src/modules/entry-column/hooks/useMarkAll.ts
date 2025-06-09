import { getFolderFeedsByFeedId } from "@follow/store/subscription/getter"
import { unreadSyncService } from "@follow/store/unread/store"

import { getGeneralSettings } from "~/atoms/settings/general"
import { getRouteParams } from "~/hooks/biz/useRouteParams"

export interface MarkAllFilter {
  startTime: number
  endTime: number
}

export const markAllByRoute = async (time?: MarkAllFilter) => {
  const routerParams = getRouteParams()
  const { feedId, view, inboxId, listId } = routerParams
  const folderIds = getFolderFeedsByFeedId({
    feedId,
    view,
  })

  if (!routerParams) return

  const { hidePrivateSubscriptionsInTimeline: excludePrivate } = getGeneralSettings()
  if (typeof routerParams.feedId === "number" || routerParams.isAllFeeds) {
    unreadSyncService.markViewAsRead({
      view,
      time,
      excludePrivate,
    })
  } else if (inboxId) {
    unreadSyncService.markViewAsRead({
      filter: {
        inboxId,
      },
      view,
      time,
      excludePrivate,
    })
  } else if (listId) {
    unreadSyncService.markViewAsRead({
      filter: {
        listId,
      },
      view,
      time,
      excludePrivate,
    })
  } else if (folderIds?.length) {
    unreadSyncService.markViewAsRead({
      filter: {
        feedIdList: folderIds,
      },
      view,
      time,
      excludePrivate,
    })
  } else if (routerParams.feedId) {
    unreadSyncService.markViewAsRead({
      filter: {
        feedIdList: routerParams.feedId?.split(","),
      },
      view,
      time,
      excludePrivate,
    })
  }
}
