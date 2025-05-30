import { FeedViewType, views } from "@follow/constants"
import { sortByAlphabet } from "@follow/utils/utils"
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
import { getDefaultCategory } from "./utils"

export const usePrefetchSubscription = (view?: FeedViewType) => {
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

export const useGroupedSubscription = ({
  view,
  autoGroup,
}: {
  view: FeedViewType
  autoGroup: boolean
}) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        const feedIds = state.feedIdByView[view]

        const grouped = {} as Record<string, string[]>
        const unGrouped = []

        const autoGrouped = {} as Record<string, string[]>

        for (const feedId of feedIds) {
          const subscription = state.data[feedId]
          if (!subscription) continue
          const { category } = subscription
          if (!category) {
            const defaultCategory = getDefaultCategory(subscription)
            if (defaultCategory && autoGroup) {
              if (!autoGrouped[defaultCategory]) {
                autoGrouped[defaultCategory] = []
              }
              autoGrouped[defaultCategory].push(feedId)
            } else {
              unGrouped.push(feedId)
            }
            continue
          }
          if (!grouped[category]) {
            grouped[category] = []
          }
          grouped[category].push(feedId)
        }

        if (autoGroup) {
          for (const category of Object.keys(autoGrouped)) {
            if (autoGrouped[category] && autoGrouped[category].length > 1) {
              grouped[category] = autoGrouped[category]
            } else {
              unGrouped.push(...autoGrouped[category]!)
            }
          }
        }

        return {
          grouped,
          unGrouped,
        }
      },
      [autoGroup, view],
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

const sortGroupedSubscriptionByUnread = (
  leftCategory: string,
  rightCategory: string,
  view: FeedViewType,
) => {
  const leftFeedIds = getSubscriptionByCategory({ category: leftCategory, view })
  const rightFeedIds = getSubscriptionByCategory({ category: rightCategory, view })

  const leftUnreadCount = leftFeedIds.reduce((acc, feedId) => {
    return acc + getUnreadCount(feedId)
  }, 0)
  const rightUnreadCount = rightFeedIds.reduce((acc, feedId) => {
    return acc + getUnreadCount(feedId)
  }, 0)
  return -(rightUnreadCount - leftUnreadCount)
}

export const useSortedGroupedSubscription = ({
  view,
  grouped,
  sortBy,
  sortOrder,
  hideAllReadSubscriptions,
}: {
  view: FeedViewType
  grouped: Record<string, string[]>
  sortBy: "alphabet" | "count"
  sortOrder: "asc" | "desc"
  hideAllReadSubscriptions: boolean
}) => {
  return useSubscriptionStore(
    useCallback(() => {
      const categories = Object.keys(grouped)
      const sortedCategories = categories.sort((a, b) => {
        const sortMethod = sortBy === "alphabet" ? sortByAlphabet : sortGroupedSubscriptionByUnread
        const result = sortMethod(a, b, view)
        return sortOrder === "asc" ? result : -result
      })
      const sortedList = [] as { category: string; subscriptionIds: string[] }[]
      for (const category of sortedCategories) {
        if (!hideAllReadSubscriptions || grouped[category]?.some((id) => getUnreadCount(id) > 0)) {
          sortedList.push({ category, subscriptionIds: grouped[category]! })
        }
      }
      return sortedList
    }, [grouped, sortBy, sortOrder, view, hideAllReadSubscriptions]),
  )
}

export const useSortedUngroupedSubscription = ({
  ids,
  sortBy,
  sortOrder,
  hideAllReadSubscriptions,
}: {
  ids: string[]
  sortBy: "alphabet" | "count"
  sortOrder: "asc" | "desc"
  hideAllReadSubscriptions: boolean
}) => {
  return useSubscriptionStore(
    useCallback(() => {
      return ids
        .filter((id) => {
          return !hideAllReadSubscriptions || getUnreadCount(id) > 0
        })
        .sort((a, b) => {
          const sortMethod =
            sortBy === "alphabet" ? sortUngroupedSubscriptionByAlphabet : sortByUnread
          const result = sortMethod(a, b)
          return sortOrder === "asc" ? result : -result
        })
    }, [ids.toString(), sortBy, sortOrder, hideAllReadSubscriptions]),
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

export const useSortedListSubscription = ({
  ids,
  sortBy,
  hideAllReadSubscriptions,
}: {
  ids: string[]
  sortBy: "alphabet" | "unread"
  hideAllReadSubscriptions: boolean
}) => {
  return useSubscriptionStore(
    useCallback(() => {
      return ids
        .concat()
        .filter((id) => !hideAllReadSubscriptions || getUnreadCount(id) > 0)
        .sort((a, b) => {
          const leftList = getList(a)
          const rightList = getList(b)
          if (!leftList || !rightList) return 0
          if (sortBy === "alphabet") {
            return sortByAlphabet(leftList.title, rightList.title)
          }
          return sortByUnread(a, b)
        })
    }, [ids.toString(), sortBy, hideAllReadSubscriptions]),
  )
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

export const useSubscriptionCategory = (view?: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return view === undefined ? [] : Array.from(state.categories[view])
      },
      [view],
    ),
  )
}

export const getSubscriptionCategory = (view?: FeedViewType) => {
  const state = useSubscriptionStore.getState()
  return view === undefined ? [] : Array.from(state.categories[view])
}

export const useSubscriptionByFeedId = (feedId?: string) =>
  useSubscriptionStore(useCallback((state) => (feedId ? state.data[feedId] : undefined), [feedId]))

export const useSubscriptionByListId = (listId: string) =>
  useSubscriptionStore(useCallback((state) => state.data[listId] || null, [listId]))

export const useViewWithSubscription = () =>
  useSubscriptionStore(
    useCallback((state) => {
      return views
        .filter((view) => {
          if (
            view.view === FeedViewType.Articles ||
            view.view === FeedViewType.SocialMedia ||
            view.view === FeedViewType.Pictures ||
            view.view === FeedViewType.Videos
          ) {
            return true
          } else {
            return state.feedIdByView[view.view].size > 0
          }
        })
        .map((v) => v.view)
    }, []),
  )
