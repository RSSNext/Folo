import { getGeneralSettings } from "~/atoms/settings/general"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { getFolderFeedsByFeedId, subscriptionActions } from "~/store/subscription"

export interface MarkAllFilter {
  startTime: number
  endTime: number
}

export const markAllByRoute = async (filter?: MarkAllFilter) => {
  const routerParams = getRouteParams()
  const { feedId, view, inboxId, listId } = routerParams
  const folderIds = getFolderFeedsByFeedId({
    feedId,
    view,
  })

  if (!routerParams) return

  if (typeof routerParams.feedId === "number" || routerParams.isAllFeeds) {
    const { hidePrivateSubscriptionsInTimeline } = getGeneralSettings()
    subscriptionActions.markReadByView({
      view,
      filter,
      excludePrivate: hidePrivateSubscriptionsInTimeline,
    })
  } else if (inboxId) {
    subscriptionActions.markReadByIds({
      inboxId,
      view,
      filter,
    })
  } else if (listId) {
    subscriptionActions.markReadByIds({
      listId,
      view,
      filter,
    })
  } else if (folderIds?.length) {
    subscriptionActions.markReadByIds({
      feedIds: folderIds,
      view,
      filter,
    })
  } else if (routerParams.feedId) {
    subscriptionActions.markReadByIds({
      feedIds: routerParams.feedId?.split(","),
      view,
      filter,
    })
  }
}
