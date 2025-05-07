import type { FeedViewType } from "@follow/constants"

import {
  folderFeedsByFeedIdSelector,
  subscriptionByViewSelector,
  subscriptionCategoryExistSelector,
} from "./selector"
import { useSubscriptionStore } from "./store"

const get = useSubscriptionStore.getState
export const getSubscriptionByFeedId = (feedId: FeedId) => {
  const state = get()
  return state.data[feedId]
}

export const isListSubscription = (feedId?: FeedId) => {
  if (!feedId) return false
  const subscription = getSubscriptionByFeedId(feedId)
  if (!subscription) return false
  return "listId" in subscription && !!subscription.listId
}

export const subscriptionCategoryExist = (name: string) =>
  subscriptionCategoryExistSelector(name)(get())

export const getFolderFeedsByFeedId = ({ feedId, view }: { feedId?: string; view: FeedViewType }) =>
  folderFeedsByFeedIdSelector({ feedId, view })(get()) || []

export const getSubscriptionByView = (view: FeedViewType) =>
  subscriptionByViewSelector(view)(get()) || []
