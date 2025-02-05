import type { FeedViewType } from "@follow/constants"
import { sortByAlphabet } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { getFeed } from "../feed/getter"
import { getList } from "../list/getters"
import { getUnreadCount } from "../unread/getter"
import {
  getFeedSubscriptionByView,
  getSubscription,
  getSubscriptionByCategory,
  getSubscriptionByView,
} from "./getter"
import { subscriptionSyncService, useSubscriptionStore } from "./store"

export const usePrefetchSubscription = (view: FeedViewType) => {
  return useQuery({
    queryKey: ["subscription", view],
    queryFn: () => subscriptionSyncService.fetch(view),
    staleTime: 30 * 1000 * 60, // 30 minutes
  })
}

const sortUngroupedSubscriptionByAlphabet = (
  leftSubscriptionId: string,
  rightSubscriptionId: string,
) => {
  const leftSubscription = getSubscription(leftSubscriptionId)
  const rightSubscription = getSubscription(rightSubscriptionId)

  if (!leftSubscription || !rightSubscription) return 0

  if (!leftSubscription.feedId || !rightSubscription.feedId) return 0
  const leftFeed = getFeed(leftSubscription.feedId)
  const rightFeed = getFeed(rightSubscription.feedId)

  if (!leftFeed || !rightFeed) return 0

  const comparedLeftTitle = leftSubscription.title || leftFeed.title!
  const comparedRightTitle = rightSubscription.title || rightFeed.title!

  return sortByAlphabet(comparedLeftTitle, comparedRightTitle)
}

export const useSubscriptionByView = (view: FeedViewType) => {
  return useSubscriptionStore(useCallback(() => getSubscriptionByView(view), [view]))
}

export const useFeedSubscriptionByView = (view: FeedViewType) => {
  return useSubscriptionStore(useCallback(() => getFeedSubscriptionByView(view), [view]))
}

export const useGroupedSubscription = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        const feedIds = state.feedIdByView[view]

        const grouped = {} as Record<string, string[]>
        const unGrouped = []

        for (const feedId of feedIds) {
          const subscription = state.data[feedId]
          if (!subscription) continue
          const { category } = subscription
          if (!category) {
            unGrouped.push(feedId)
            continue
          }
          if (!grouped[category]) {
            grouped[category] = []
          }
          grouped[category].push(feedId)
        }

        return {
          grouped,
          unGrouped,
        }
      },
      [view],
    ),
  )
}

const sortByUnread = (_leftSubscriptionId: string, _rightSubscriptionId: string) => {
  const leftSubscription = getSubscription(_leftSubscriptionId)
  const rightSubscription = getSubscription(_rightSubscriptionId)

  const leftSubscriptionId = leftSubscription?.feedId || leftSubscription?.listId
  const rightSubscriptionId = rightSubscription?.feedId || rightSubscription?.listId

  if (!leftSubscriptionId || !rightSubscriptionId) return 0
  return getUnreadCount(rightSubscriptionId) - getUnreadCount(leftSubscriptionId)
}

const sortGroupedSubscriptionByUnread = (leftCategory: string, rightCategory: string) => {
  const leftFeedIds = getSubscriptionByCategory(leftCategory)
  const rightFeedIds = getSubscriptionByCategory(rightCategory)

  const leftUnreadCount = leftFeedIds.reduce((acc, feedId) => {
    return acc + getUnreadCount(feedId)
  }, 0)
  const rightUnreadCount = rightFeedIds.reduce((acc, feedId) => {
    return acc + getUnreadCount(feedId)
  }, 0)
  return -(rightUnreadCount - leftUnreadCount)
}

export const useSortedGroupedSubscription = (
  grouped: Record<string, string[]>,
  sortBy: "alphabet" | "count",
  sortOrder: "asc" | "desc",
) => {
  return useSubscriptionStore(
    useCallback(() => {
      const categories = Object.keys(grouped)
      const sortedCategories = categories.sort((a, b) => {
        const sortMethod = sortBy === "alphabet" ? sortByAlphabet : sortGroupedSubscriptionByUnread
        const result = sortMethod(a, b)
        return sortOrder === "asc" ? result : -result
      })
      const sortedList = [] as { category: string; subscriptionIds: string[] }[]
      for (const category of sortedCategories) {
        sortedList.push({ category, subscriptionIds: grouped[category]! })
      }
      return sortedList
    }, [grouped, sortBy, sortOrder]),
  )
}

export const useSortedUngroupedSubscription = (
  ids: string[],
  sortBy: "alphabet" | "count",
  sortOrder: "asc" | "desc",
) => {
  return useSubscriptionStore(
    useCallback(() => {
      return ids.sort((a, b) => {
        const sortMethod =
          sortBy === "alphabet" ? sortUngroupedSubscriptionByAlphabet : sortByUnread
        const result = sortMethod(a, b)
        return sortOrder === "asc" ? result : -result
      })
    }, [ids, sortBy, sortOrder]),
  )
}

export const useSortedFeedSubscriptionByAlphabet = (ids: string[]) => {
  return useSubscriptionStore(
    useCallback(() => {
      return ids.sort((a, b) => {
        const leftFeed = getFeed(a)
        const rightFeed = getFeed(b)
        if (!leftFeed || !rightFeed) return 0
        return sortByAlphabet(leftFeed.title!, rightFeed.title!)
      })
    }, [ids]),
  )
}

export const useSubscription = (id: string) => {
  return useSubscriptionStore((state) => {
    return state.data[id]
  })
}

export const useAllListSubscription = () => {
  return useSubscriptionStore(
    useCallback((state) => {
      return Object.values(state.listIdByView).flatMap((list) => Array.from(list))
    }, []),
  )
}

export const useListSubscription = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.listIdByView[view])
      },
      [view],
    ),
  )
}

export const useSortedListSubscription = (ids: string[], sortBy: "alphabet" | "unread") => {
  return useSubscriptionStore(() => {
    return ids.concat().sort((a, b) => {
      const leftList = getList(a)
      const rightList = getList(b)
      if (!leftList || !rightList) return 0
      if (sortBy === "alphabet") {
        return sortByAlphabet(leftList.title, rightList.title)
      }
      return sortByUnread(a, b)
    })
  })
}

export const useInboxSubscription = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.inboxIdByView[view])
      },
      [view],
    ),
  )
}

export const useListSubscriptionCategory = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.categories[view])
      },
      [view],
    ),
  )
}

export const useSubscriptionByFeedId = (feedId: string) =>
  useSubscriptionStore(useCallback((state) => state.data[feedId] || null, [feedId]))

export const useSubscriptionByListId = (listId: string) =>
  useSubscriptionStore(useCallback((state) => state.data[listId] || null, [listId]))
