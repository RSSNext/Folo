import { FeedViewType, views } from "@follow/constants"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useRef } from "react"

import {
  getAllFeedSubscriptionIdsSelector,
  getAllFeedSubscriptionSelector,
  getAllListSubscriptionSelector,
  getAllSubscriptionSelector,
  getCategoriesByViewSelector,
  getCategoriesSelector,
  getCategoryOpenStateByViewSelector,
  getFeedSubscriptionByViewSelector,
  getFeedSubscriptionCountSelector,
  getFeedSubscriptionIdsByViewSelector,
  getFeedSubscriptionIdsSelector,
  getFeedSubscriptionSelector,
  getGroupedSubscriptionSelector,
  getIsListSubscriptionSelector,
  getIsSubscribedSelector,
  getListSubscriptionByViewSelector,
  getListSubscriptionCountSelector,
  getListSubscriptionIdsSelector,
  getListSubscriptionSelector,
  getNonPrivateSubscriptionIdsSelector,
  getSortedFeedSubscriptionByAlphabetSelector,
  getSortedGroupedSubscriptionSelector,
  getSortedListSubscriptionSelector,
  getSortedUngroupedSubscriptionSelector,
  getSubscriptionByIdSelector,
  getSubscriptionCategoryExistSelector,
  getSubscriptionIdsByViewSelector,
  getSubscriptionsByIdsSelector,
} from "./getter"
import { folderFeedsByFeedIdSelector } from "./selectors"
import type { SubscriptionState } from "./store"
import { subscriptionSyncService, useSubscriptionStore } from "./store"
import { getDefaultCategory } from "./utils"

export const usePrefetchSubscription = (view?: FeedViewType) => {
  return useQuery({
    queryKey: ["subscription", view],
    queryFn: () => subscriptionSyncService.fetch(view),
    staleTime: 30 * 1000 * 60, // 30 minutes
  })
}

export const useSubscriptionIdsByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getSubscriptionIdsByViewSelector(state)(view), [view]),
  )
}

export const useFeedSubscriptionIdsByView = (view: FeedViewType | undefined) => {
  return useSubscriptionStore(
    useCallback((state) => getFeedSubscriptionIdsByViewSelector(state)(view), [view]),
  )
}

export const useFeedSubscriptionByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getFeedSubscriptionByViewSelector(state)(view), [view]),
  )
}

export const useListSubscriptionByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getListSubscriptionByViewSelector(state)(view), [view]),
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
      (state) => getGroupedSubscriptionSelector(state)({ view, autoGroup }),
      [autoGroup, view],
    ),
  )
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
    useCallback(
      (state) => {
        return getSortedGroupedSubscriptionSelector(state)({
          view,
          grouped,
          sortBy,
          sortOrder,
          hideAllReadSubscriptions,
        })
      },
      [grouped, sortBy, sortOrder, view, hideAllReadSubscriptions],
    ),
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
    useCallback(
      (state) => {
        return getSortedUngroupedSubscriptionSelector(state)({
          ids,
          sortBy,
          sortOrder,
          hideAllReadSubscriptions,
        })
      },
      [ids, sortBy, sortOrder, hideAllReadSubscriptions],
    ),
  )
}

export const useSortedFeedSubscriptionByAlphabet = (ids: string[]) => {
  return useSubscriptionStore(
    useCallback(
      (state) => {
        return getSortedFeedSubscriptionByAlphabetSelector(state)(ids)
      },
      [ids],
    ),
  )
}

export const useSubscriptionById = (id: string | undefined | null) => {
  return useSubscriptionStore(useCallback((state) => getSubscriptionByIdSelector(state)(id), [id]))
}
export const useSubscriptionsByIds = (ids: string[]) => {
  const idsString = ids.toString()
  return useSubscriptionStore(
    useCallback(
      (state) => getSubscriptionsByIdsSelector(state)(ids),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [idsString],
    ),
  )
}

export const useSubscriptionByFeedId = (feedId: string | undefined | null) =>
  useSubscriptionById(feedId)
export const useSubscriptionsByFeedIds = (feedIds: string[]) => useSubscriptionsByIds(feedIds)
export const useSubscriptionByListId = (listId: string | undefined | null) =>
  useSubscriptionById(listId)

export const useAllListSubscription = () => {
  return useSubscriptionStore((state) => getAllListSubscriptionSelector(state)())
}

export const useListSubscription = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getListSubscriptionSelector(state)(view), [view]),
  )
}

export const useListSubscriptionIds = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getListSubscriptionIdsSelector(state)(view), [view]),
  )
}

export const useFeedSubscription = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getFeedSubscriptionSelector(state)(view), [view]),
  )
}

export const useFeedSubscriptionIds = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getFeedSubscriptionIdsSelector(state)(view), [view]),
  )
}

export const useAllFeedSubscription = () => {
  const stableSelector = useRef((state: SubscriptionState) =>
    getAllFeedSubscriptionSelector(state)(),
  ).current
  return useSubscriptionStore(stableSelector)
}

export const useAllFeedSubscriptionIds = () => {
  const stableSelector = useRef((state: SubscriptionState) =>
    getAllFeedSubscriptionIdsSelector(state)(),
  ).current
  return useSubscriptionStore(stableSelector)
}

export const useAllSubscription = () => {
  const stableSelector = useRef((state: SubscriptionState) =>
    getAllSubscriptionSelector(state)(),
  ).current
  return useSubscriptionStore(stableSelector)
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
    useCallback(
      (state) => {
        return getSortedListSubscriptionSelector(state)({
          ids,
          sortBy,
          hideAllReadSubscriptions,
        })
      },
      [ids, sortBy, hideAllReadSubscriptions],
    ),
  )
}

export const useCategories = (view?: FeedViewType) => {
  return useSubscriptionStore(useCallback((state) => getCategoriesSelector(state)(view), [view]))
}

export const useSubscriptionCategoryExist = (categoryId: string | undefined | null) => {
  return useSubscriptionStore(
    useCallback((state) => getSubscriptionCategoryExistSelector(state)(categoryId), [categoryId]),
  )
}

export const getSubscriptionCategory = (view?: FeedViewType) => {
  const state = useSubscriptionStore.getState()
  return view === undefined ? [] : Array.from(state.categories[view])
}

export const useViewWithSubscription = () =>
  useSubscriptionStore((state) => {
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
  })

export const useCategoriesByView = (view: FeedViewType) => {
  return useSubscriptionStore(
    useCallback((state) => getCategoriesByViewSelector(state)(view), [view]),
  )
}

export const useListSubscriptionCount = () => {
  const stableSelector = useRef((state: SubscriptionState) =>
    getListSubscriptionCountSelector(state)(),
  ).current
  return useSubscriptionStore(stableSelector)
}

export const useFeedSubscriptionCount = () => {
  const stableSelector = useRef((state: SubscriptionState) =>
    getFeedSubscriptionCountSelector(state)(),
  ).current
  return useSubscriptionStore(stableSelector)
}

export const useIsSubscribed = (id: string | undefined) => {
  return useSubscriptionStore(useCallback((state) => getIsSubscribedSelector(state)(id), [id]))
}

export const useIsListSubscription = (id: string | undefined) => {
  return useSubscriptionStore(
    useCallback((state) => getIsListSubscriptionSelector(state)(id), [id]),
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
    useCallback((state) => getCategoryOpenStateByViewSelector(state)(view), [view]),
  )
}

export const useNonPrivateSubscriptionIds = (ids: string[]) => {
  const idsString = ids.toString()
  const nonPrivateSubscriptions = useSubscriptionStore(
    useCallback(
      (state) => getNonPrivateSubscriptionIdsSelector(state)(ids),

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [idsString],
    ),
  )

  return nonPrivateSubscriptions
}
