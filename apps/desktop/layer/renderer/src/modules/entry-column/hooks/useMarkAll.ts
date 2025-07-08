import type { FeedViewType } from "@follow/constants"
import { getFolderFeedsByFeedId } from "@follow/store/subscription/getter"
import { unreadSyncService } from "@follow/store/unread/store"

import { getGeneralSettings } from "~/atoms/settings/general"

export type MarkAllFilter =
  | {
      startTime: number
      endTime: number
    }
  | {
      insertedBefore: number
    }

export const markAllByRoute = async (
  data: {
    feedId?: string | undefined
    view: FeedViewType
    inboxId?: string | undefined
    listId?: string | undefined

    isAllFeeds?: boolean
  },
  time?: MarkAllFilter,
) => {
  const { feedId, view, inboxId, listId, isAllFeeds } = data
  const folderIds = getFolderFeedsByFeedId({
    feedId,
    view,
  })

  if (!feedId) return

  const { hidePrivateSubscriptionsInTimeline: excludePrivate } = getGeneralSettings()
  if (typeof feedId === "number" || isAllFeeds) {
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
  } else if (feedId) {
    unreadSyncService.markBatchAsRead({
      filter: {
        feedIdList: feedId?.split(","),
      },
      view,
      time,
      excludePrivate,
    })
  }
}
