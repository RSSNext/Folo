import { browserDB } from "~/database"
import type { CleanerType } from "~/database/schemas/cleaner"
import { appLog } from "~/lib/log"

import { EntryService } from "./entry"
import { FeedService } from "./feed"
import { FeedUnreadService } from "./feed-unread"
import { InboxService } from "./inbox"
import { ListService } from "./list"
import { SubscriptionService } from "./subscription"

const cleanerModel = browserDB.cleaner
class CleanerServiceStatic {
  // Clean other user subscriptions, should call this after login
  async cleanRemainingData(currentUserId: string) {
    const dbUserIds = await SubscriptionService.getUserIds()

    const otherUserIds = dbUserIds.filter((id) => id !== currentUserId)
    const remainingSubscriptions = await SubscriptionService.getUserSubscriptions(otherUserIds)
    const currentSubscription = await SubscriptionService.getUserSubscriptions([currentUserId])
    const currentSubscriptionFeedsSet = new Set(currentSubscription.map((s) => s.feedId))
    // Finds a subscripion that does not exist for the current user, but a feedId that exists in the db

    const toRemoveSubscription = remainingSubscriptions.filter(
      (s) => !currentSubscriptionFeedsSet.has(s.feedId),
    )

    const toRemoveFeedIds = toRemoveSubscription.map((s) => s.feedId)

    await Promise.allSettled([
      otherUserIds.map((id) => SubscriptionService.removeSubscription(id)),
      FeedService.bulkDelete(toRemoveFeedIds),
      FeedUnreadService.bulkDelete(toRemoveFeedIds),
      EntryService.deleteEntriesByFeedIds(toRemoveFeedIds),
    ])
  }

  /**
   * Mark the which data recently used
   */
  reset(list: { type: CleanerType; id: string }[]) {
    const now = Date.now()
    return cleanerModel.bulkPut(
      list.map((item) => ({
        refId: item.id,
        visitedAt: now,
        type: item.type,
      })),
    )
  }

  /**
   * Remove the data that not used for a long time
   */
  async cleanOutdatedData() {
    const now = Date.now()
    const expiredTime = now - 1000 * 60 * 60 * 24 * 30 // 30 days
    const data = await cleanerModel.where("visitedAt").below(expiredTime).toArray()

    if (data.length === 0) {
      return
    }
    const deleteEntries = [] as string[]
    const deleteFeeds = [] as string[]
    const deleteLists = [] as string[]
    const deleteInboxes = [] as string[]
    for (const item of data) {
      switch (item.type) {
        case "feed": {
          deleteFeeds.push(item.refId)
          break
        }
        case "entry": {
          deleteEntries.push(item.refId)
          break
        }
        case "list": {
          deleteLists.push(item.refId)
          // TODO delete entries related to the list
          break
        }
        case "inbox": {
          deleteInboxes.push(item.refId)
          break
        }
      }
    }

    appLog("Clean outdated data...", "feeds:", deleteFeeds.length, "entries:", deleteEntries.length)
    await Promise.allSettled([
      FeedService.bulkDelete(deleteFeeds),
      EntryService.deleteEntries(deleteEntries),
      EntryService.deleteEntriesByFeedIds(deleteFeeds),
      cleanerModel.bulkDelete(data.map((d) => d.refId)),
      ListService.bulkDelete(deleteLists),
      InboxService.bulkDelete(deleteInboxes),
    ])
  }

  async cleanRefById(refIds: string[]) {
    return cleanerModel.bulkDelete(refIds)
  }
}
export const CleanerService = new CleanerServiceStatic()
