import type { FeedViewType } from "@follow/constants"

import { FEED_COLLECTION_LIST, ROUTE_FEED_IN_FOLDER } from "../constants/app"
import type { SubscriptionState } from "./store"
import { getDefaultCategory } from "./utils"

export const folderFeedsByFeedIdSelector =
  ({ feedId, view }: { feedId?: string; view: FeedViewType }) =>
  (state: SubscriptionState): string[] => {
    if (typeof feedId !== "string") return []
    if (feedId === FEED_COLLECTION_LIST) {
      return [feedId]
    }

    if (!feedId.startsWith(ROUTE_FEED_IN_FOLDER)) {
      return []
    }

    const folderName = feedId.replace(ROUTE_FEED_IN_FOLDER, "")
    const feedIds: string[] = []
    for (const feedId in state.data) {
      const subscription = state.data[feedId]!
      if (
        subscription.view === view &&
        (subscription.category
          ? subscription.category === folderName
          : getDefaultCategory(subscription) === folderName)
      ) {
        feedIds.push(feedId)
      }
    }
    return feedIds
  }
