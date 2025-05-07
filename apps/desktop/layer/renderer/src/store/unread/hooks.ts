import type { FeedViewType } from "@follow/constants"
import { useCallback, useMemo } from "react"

import { useListsFeedIds } from "../list"
import { useListStore } from "../list/store"
import { useSubscriptionByView } from "../subscription/hooks"
import { useFeedUnreadStore } from "."

export const useUnreadByView = (view: FeedViewType) => {
  const subscriptions = useSubscriptionByView(view)

  const ids = useMemo(() => {
    const ids = {
      feedIds: [] as string[],
      listIds: [] as string[],
      inboxIds: [] as string[],
    }
    subscriptions.forEach((subscription) => {
      if (subscription?.listId) {
        ids.listIds.push(subscription.listId)
      } else if (subscription?.inboxId) {
        ids.inboxIds.push(subscription.inboxId)
      } else if (subscription?.feedId) {
        ids.feedIds.push(subscription.feedId)
      }
    })

    return ids
  }, [subscriptions])

  const allFeedIds = useMemo(() => {
    const state = useListStore.getState()
    const listList = ids.listIds.map((id) => state.lists[id])

    return new Set([...listList.flatMap((list) => list?.feedIds || []), ...ids.feedIds])
  }, [ids])

  const totalUnread = useFeedUnreadStore(
    useCallback(
      (state) => {
        let unread = 0

        for (const feedId of allFeedIds) {
          unread += state.data[feedId] || 0
        }
        for (const inboxId of ids.inboxIds) {
          unread += state.data[inboxId] || 0
        }
        return unread
      },
      [allFeedIds, ids.inboxIds],
    ),
  )

  return totalUnread
}

export const useUnreadByListId = (listId: string) => {
  const listFeedIds = useListsFeedIds([listId])

  const totalUnread = useFeedUnreadStore(
    useCallback(
      (state) => {
        let unread = 0

        for (const feedId of listFeedIds) {
          unread += state.data[feedId] || 0
        }
        return unread
      },
      [listFeedIds],
    ),
  )

  return totalUnread
}
