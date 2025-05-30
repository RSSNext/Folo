import type { FeedViewType } from "@follow/constants"

import type { FeedQueryParams } from "../feed"
import { getFeedByIdOrUrl } from "../feed"
import {
  folderFeedsByFeedIdSelector,
  subscriptionByViewSelector,
  subscriptionCategoryExistSelector,
} from "./selector"
import { useSubscriptionStore } from "./store"

export const getSubscriptionByFeedId = (feedId?: FeedId) => {
  if (!feedId) return
  return useSubscriptionStore.getState().data[feedId]
}
export const getSubscriptionByFeedIdOrUrl = (params: FeedQueryParams) => {
  const feed = getFeedByIdOrUrl(params)
  if (!feed) return
  return getSubscriptionByFeedId(feed.id)
}

export const isListSubscription = (feedId?: FeedId) => {
  if (!feedId) return false
  const subscription = getSubscriptionByFeedId(feedId)
  if (!subscription) return false
  return "listId" in subscription && !!subscription.listId
}

export const subscriptionCategoryExist = (name: string) =>
  subscriptionCategoryExistSelector(name)(useSubscriptionStore.getState())

export const getFolderFeedsByFeedId = ({ feedId, view }: { feedId?: string; view: FeedViewType }) =>
  folderFeedsByFeedIdSelector({ feedId, view })(useSubscriptionStore.getState()) || []

export const getSubscriptionByView = (view: FeedViewType) =>
  subscriptionByViewSelector(view)(useSubscriptionStore.getState()) || []
