import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { useSubscriptionStore } from "@follow/store/subscription/store"
import { isBizId } from "@follow/utils/utils"
import { useCallback } from "react"

import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

const getPreviewSubscriptionId = ({ feedId, listId }: { feedId?: string; listId?: string }) => {
  if (listId) {
    return listId
  }
  return feedId && isBizId(feedId) ? feedId : undefined
}

export const getIsPreviewFeed = (params: { feedId?: string; listId?: string }) => {
  const subscriptionId = getPreviewSubscriptionId(params)
  return !!subscriptionId && !getSubscriptionByFeedId(subscriptionId)
}

export const useIsPreviewFeed = () => {
  const listId = useRouteParamsSelector((s) => s.listId)
  const feedId = useRouteParamsSelector((s) => s.feedId)
  const subscriptionId = getPreviewSubscriptionId({ feedId, listId })

  // Subscribe to the store: on a cold start the subscriptions load after the
  // route is already set, and a memoized getter would keep treating the
  // subscribed feed as a preview.
  const isSubscribed = useSubscriptionStore(
    useCallback((state) => !!subscriptionId && !!state.data[subscriptionId], [subscriptionId]),
  )

  return !!subscriptionId && !isSubscribed
}
