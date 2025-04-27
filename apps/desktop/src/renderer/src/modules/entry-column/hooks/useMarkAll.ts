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
    subscriptionActions.markReadByView(view, filter)
  } else if (inboxId) {
    subscriptionActions.markReadByFeedIds({
      inboxId,
      view,
      filter,
    })
  } else if (listId) {
    subscriptionActions.markReadByFeedIds({
      listId,
      view,
      filter,
    })
  } else if (folderIds?.length) {
    subscriptionActions.markReadByFeedIds({
      feedIds: folderIds,
      view,
      filter,
    })
  } else if (routerParams.feedId) {
    subscriptionActions.markReadByFeedIds({
      feedIds: routerParams.feedId?.split(","),
      view,
      filter,
    })
  }
}
