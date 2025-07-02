import { capitalizeFirstLetter, parseUrl } from "@follow/utils/utils"

import { getFeedById } from "../feed/getter"
import type { SubscriptionModel } from "./types"

export const getInboxStoreId = (inboxId: string) => `inbox/${inboxId}`

export const getSubscriptionStoreId = (subscription: SubscriptionModel) => {
  if (subscription.feedId) return subscription.feedId
  if (subscription.listId) return subscription.listId
  if (subscription.inboxId) return getInboxStoreId(subscription.inboxId)
  throw new Error("Invalid subscription")
}

export const getDefaultCategory = (subscription?: SubscriptionModel) => {
  if (!subscription) return null
  const { feedId } = subscription
  if (!feedId) return null
  const siteUrl = getFeedById(feedId)?.siteUrl
  if (!siteUrl) return null
  const parsed = parseUrl(siteUrl)
  return parsed?.domain ? capitalizeFirstLetter(parsed.domain) : null
}
