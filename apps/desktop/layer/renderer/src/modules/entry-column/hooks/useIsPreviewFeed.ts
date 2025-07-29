import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { isBizId } from "@follow/utils/utils"
import { useMemo } from "react"

import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export const useIsPreviewFeed = () => {
  const listId = useRouteParamsSelector((s) => s.listId)
  const feedId = useRouteParamsSelector((s) => s.feedId)

  return useMemo(() => {
    let isPreview = false
    if (listId) {
      isPreview = !getSubscriptionByFeedId(listId)
    } else if (feedId) {
      isPreview = isBizId(feedId) && !getSubscriptionByFeedId(feedId)
    }
    return isPreview
  }, [listId, feedId])
}
