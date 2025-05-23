import type { FeedViewType } from "@follow/constants"
import { useCallback, useMemo } from "react"

import { useListsFeedIds } from "../list"
import { getListFeedIds } from "../list/getters"
import { useSubscriptionByView } from "../subscription/hooks"
import { useUnreadStore } from "."

export const useUnreadById = (id: string) => {
  return useUnreadStore(useCallback((state) => state.data[id] || 0, [id]))
}

export const useUnreadByIds = (ids: string[]) => {
  return useUnreadStore(
    useCallback(
      (state) => ids.reduce((acc, id) => (state.data[id] || 0) + acc, 0),
      [ids.toString()],
    ),
  )
}

export const useSortedIdsByUnread = (ids: string[], isDesc?: boolean) => {
  return useUnreadStore(
    useCallback(
      (state) =>
        ids.sort((a, b) => {
          const unreadCompare = (state.data[b] || 0) - (state.data[a] || 0)
          if (unreadCompare !== 0) {
            return isDesc ? unreadCompare : -unreadCompare
          }
          return a.localeCompare(b)
        }),
      [ids.toString(), isDesc],
    ),
  )
}

/**
 * @param categories key: category name, value: array of ids
 * @returns array of tuples [category, ids]
 */
export const useSortedCategoriesByUnread = (
  categories: Record<string, string[]>,
  isDesc?: boolean,
) => {
  return useUnreadStore(
    useCallback(
      (state) => {
        const sortedList = [] as [string, string[]][]

        const folderUnread = {} as Record<string, number>
        // Calc total unread count for each folder
        for (const category in categories) {
          folderUnread[category] = categories[category]!.reduce(
            (acc, cur) => (state.data[cur] || 0) + acc,
            0,
          )
        }

        // Sort by unread count
        Object.keys(folderUnread)
          .sort((a, b) => folderUnread[b]! - folderUnread[a]!)
          .forEach((key) => {
            sortedList.push([key, categories[key]!])
          })

        if (!isDesc) {
          sortedList.reverse()
        }
        return sortedList
      },
      [categories, isDesc],
    ),
  )
}

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
    const listList = ids.listIds.map((id) => getListFeedIds(id))
    return new Set([...listList.flat(), ...ids.feedIds])
  }, [ids])

  const totalUnread = useUnreadStore(
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

  const totalUnread = useUnreadStore(
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
