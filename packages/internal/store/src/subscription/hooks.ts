import { FeedViewType, views } from "@follow/constants"
import { sortByAlphabet } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import { getFeedById } from "../feed/getter"
import { getInboxList } from "../inbox/getters"
import { getListById, getListFeedIds } from "../list/getters"
import { getUnreadById } from "../unread/getters"
import { getSubscriptionByCategory, getSubscriptionById } from "./getter"
import { folderFeedsByFeedIdSelector } from "./selectors"
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
  const leftSubscription = getSubscriptionById(leftSubscriptionId)
  const rightSubscription = getSubscriptionById(rightSubscriptionId)

  if (!leftSubscription || !rightSubscription) return 0

  if (!leftSubscription.feedId || !rightSubscription.feedId) return 0
  const leftFeed = getFeedById(leftSubscription.feedId)
  const rightFeed = getFeedById(rightSubscription.feedId)

  if (!leftFeed || !rightFeed) return 0

  const comparedLeftTitle = leftSubscription.title || leftFeed.title!
  const comparedRightTitle = rightSubscription.title || rightFeed.title!

  return sortByAlphabet(comparedLeftTitle, comparedRightTitle)
}

export const useSubscriptionIdsByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.feedIdByView[view])
          .concat(view === FeedViewType.Articles ? getInboxList().map((i) => i.id) : [])
          .concat(Array.from(state.listIdByView[view]).flatMap((id) => getListFeedIds(id) ?? []))
      },
      [view],
    ),
  )
}

export const useFeedSubscriptionIdsByView = (view: FeedViewType | undefined) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return typeof view === "number" ? Array.from(state.feedIdByView[view]) : []
      },
      [view],
    ),
  )
}

export const useFeedSubscriptionByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.feedIdByView[view])
          .map((feedId) => state.data[feedId])
          .filter((feed) => !!feed)
      },
      [view],
    ),
  )
}

export const useListSubscriptionByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.listIdByView[view])
          .map((listId) => state.data[listId])
          .filter((list) => !!list)
      },
      [view],
    ),
  )
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
        const unGrouped = [] as string[]

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
  const leftSubscription = getSubscriptionById(_leftSubscriptionId)
  const rightSubscription = getSubscriptionById(_rightSubscriptionId)

  const leftSubscriptionId = leftSubscription?.feedId || leftSubscription?.listId
  const rightSubscriptionId = rightSubscription?.feedId || rightSubscription?.listId

  if (!leftSubscriptionId || !rightSubscriptionId) return 0
  return getUnreadById(rightSubscriptionId) - getUnreadById(leftSubscriptionId)
}

const sortGroupedSubscriptionByUnread = (
  leftCategory: string,
  rightCategory: string,
  view: FeedViewType,
) => {
  const leftFeedIds = getSubscriptionByCategory({ category: leftCategory, view })
  const rightFeedIds = getSubscriptionByCategory({ category: rightCategory, view })

  const leftUnreadCount = leftFeedIds.reduce((acc, feedId) => {
    return acc + getUnreadById(feedId)
  }, 0)
  const rightUnreadCount = rightFeedIds.reduce((acc, feedId) => {
    return acc + getUnreadById(feedId)
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
        if (!hideAllReadSubscriptions || grouped[category]?.some((id) => getUnreadById(id) > 0)) {
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
          return !hideAllReadSubscriptions || getUnreadById(id) > 0
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
        const leftFeed = getFeedById(a)
        const rightFeed = getFeedById(b)
        if (!leftFeed || !rightFeed) return 0
        return sortByAlphabet(leftFeed.title!, rightFeed.title!)
      })
    }, [ids]),
  )
}

export const useSubscriptionById = (id: string | undefined | null) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return id ? state.data[id] : undefined
      },
      [id],
    ),
  )
}
export const useSubscriptionsByIds = (ids: string[]) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return ids.map((id) => state.data[id])
      },
      [ids.toString()],
    ),
  )
}

export const useSubscriptionByFeedId = (feedId: string | undefined | null) =>
  useSubscriptionById(feedId)
export const useSubscriptionsByFeedIds = (feedIds: string[]) => useSubscriptionsByIds(feedIds)
export const useSubscriptionByListId = (listId: string | undefined | null) =>
  useSubscriptionById(listId)

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
      (state) => Array.from(state.listIdByView[view]).map((listId) => state.data[listId]),
      [view],
    ),
  )
}

export const useListSubscriptionIds = (view: FeedViewType) => {
  return useSubscriptionStore(useCallback((state) => Array.from(state.listIdByView[view]), [view]))
}

export const useFeedSubscription = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => Array.from(state.feedIdByView[view]).map((feedId) => state.data[feedId]),
      [view],
    ),
  )
}

export const useFeedSubscriptionIds = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return Array.from(state.feedIdByView[view])
      },
      [view],
    ),
  )
}

export const useAllFeedSubscription = () => {
  return useSubscriptionStore(
    useCallback((state) => {
      return Object.values(state.feedIdByView).flatMap((feedId) =>
        Array.from(feedId)
          .map((id) => state.data[id])
          .filter((feed) => !!feed),
      )
    }, []),
  )
}

export const useAllFeedSubscriptionIds = () => {
  return useSubscriptionStore(
    useCallback((state) => {
      return Object.values(state.feedIdByView).flatMap((feedId) => Array.from(feedId))
    }, []),
  )
}

export const useAllSubscription = () => {
  return useSubscriptionStore(
    useCallback((state) => {
      return Object.values(state.data).filter((subscription) => !!subscription)
    }, []),
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
        .filter((id) => !hideAllReadSubscriptions || getUnreadById(id) > 0)
        .sort((a, b) => {
          const leftList = getListById(a)
          const rightList = getListById(b)
          if (!leftList || !rightList) return 0
          if (sortBy === "alphabet") {
            return sortByAlphabet(leftList.title || "", rightList.title || "")
          }
          return sortByUnread(a, b)
        })
    }, [ids.toString(), sortBy, hideAllReadSubscriptions]),
  )
}

export const useCategories = (view?: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return view === undefined
          ? Array.from(
              new Set(Object.values(state.categories).flatMap((category) => Array.from(category))),
            )
          : Array.from(state.categories[view])
      },
      [view],
    ),
  )
}

export const useSubscriptionCategoryExist = (categoryId: string | undefined | null) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        if (!categoryId) return false
        return Object.values(state.categories).some((category) => category.has(categoryId))
      },
      [categoryId],
    ),
  )
}

export const getSubscriptionCategory = (view?: FeedViewType) => {
  const state = useSubscriptionStore.getState()
  return view === undefined ? [] : Array.from(state.categories[view])
}

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

export const useCategoriesByView = (view: FeedViewType) => {
  return useSubscriptionStore(useCallback((state) => state.categories[view], [view]))
}

export const useListSubscriptionCount = () => {
  return useSubscriptionStore(
    useCallback(
      (state) => Array.from(state.subscriptionIdSet).filter((id) => id.startsWith("list/")).length,
      [],
    ),
  )
}

export const useFeedSubscriptionCount = () => {
  return useSubscriptionStore(
    useCallback(
      (state) => Array.from(state.subscriptionIdSet).filter((id) => id.startsWith("feed/")).length,
      [],
    ),
  )
}

export const useIsSubscribed = (id: string | undefined) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        if (!id) return false
        return (
          state.subscriptionIdSet.has(id) ||
          state.subscriptionIdSet.has(`feed/${id}`) ||
          state.subscriptionIdSet.has(`list/${id}`) ||
          state.subscriptionIdSet.has(`inbox/${id}`)
        )
      },
      [id],
    ),
  )
}

export const useIsListSubscription = (id: string | undefined) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        if (!id) return false
        return state.subscriptionIdSet.has(`list/${id}`)
      },
      [id],
    ),
  )
}

export const useFolderFeedsByFeedId = ({
  feedId,
  view,
}: {
  feedId: string | undefined
  view: FeedViewType
}) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return folderFeedsByFeedIdSelector({ feedId, view })(state)
      },
      [feedId, view],
    ),
  )
}

export const useFeedsGroupedData = (view: FeedViewType, autoGroup: boolean) => {
  const data = useFeedSubscriptionByView(view)

  return useMemo(() => {
    if (!data || data.length === 0) return {}

    const groupFolder = {} as Record<string, string[]>

    for (const subscription of data.filter((s) => !!s)) {
      const category =
        subscription.category ||
        (autoGroup ? getDefaultCategory(subscription) : subscription.feedId)

      if (category) {
        if (!groupFolder[category]) {
          groupFolder[category] = []
        }
        if (subscription.feedId) {
          groupFolder[category].push(subscription.feedId)
        }
      }
    }

    return groupFolder
  }, [autoGroup, data])
}

export const useSubscriptionListIds = (view: FeedViewType) => {
  const data = useListSubscriptionByView(view)

  return useMemo(() => {
    if (!data || data.length === 0) return []
    const ids: string[] = []
    for (const subscription of data) {
      if (!subscription) continue
      if ("listId" in subscription) {
        ids.push(subscription.listId!)
      }
    }
    return ids
  }, [data])
}

export const useCategoryOpenStateByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return state.categoryOpenStateByView[view]
      },
      [view],
    ),
  )
}

export const useNonPrivateSubscriptionIds = (ids: string[]) => {
  const nonPrivateSubscriptions = useSubscriptionStore(
    useCallback(
      (state) => {
        return ids
          .map((id) => state.data[id])
          .filter((s) => !s?.isPrivate)
          .map((s) => s?.listId || s?.feedId)
          .filter((id) => typeof id === "string")
      },
      [ids.toString()],
    ),
  )

  return nonPrivateSubscriptions
}
