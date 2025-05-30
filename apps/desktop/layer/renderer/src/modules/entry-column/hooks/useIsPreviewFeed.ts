import { isBizId } from "@follow/utils/utils"
import { useCallback } from "react"

import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { getSubscriptionByFeedId, useSubscriptionStore } from "~/store/subscription"

export const useIsPreviewFeed = () => {
  const listId = useRouteParamsSelector((s) => s.listId)
  const feedId = useRouteParamsSelector((s) => s.feedId)

  return useSubscriptionStore(
    useCallback(() => {
      let isPreview = false
      if (listId) {
        isPreview = !getSubscriptionByFeedId(listId)
      } else if (feedId) {
        isPreview = isBizId(feedId) && !getSubscriptionByFeedId(feedId)
      }
      return isPreview
    }, [listId, feedId]),
  )
}
