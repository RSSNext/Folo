import { FeedViewType } from "@follow/constants"
import { sortByAlphabet } from "@follow/utils/utils"

import { createSingleArgGetter, createStaticGetter } from "../../lib/helper"
import { getEntry } from "../entry/getter"
import { getFeedById } from "../feed/getter"
import { getInboxList } from "../inbox/getters"
import { getListById, getListFeedIds } from "../list/getters"
import { getUnreadById, getUnreadByListId } from "../unread/getters"
import { folderFeedsByFeedIdSelector } from "./selectors"
import { useSubscriptionStore } from "./store"
import { getDefaultCategory } from "./utils"

export const getSubscriptionById = (id: string | undefined) => {
  if (!id) return
  return useSubscriptionStore.getState().data[id]
}
export const getSubscriptionByFeedId = (feedId: string | undefined) => getSubscriptionById(feedId)

export const getSubscriptionByEntryId = (entryId: string | undefined) => {
  if (!entryId) return
  const entry = getEntry(entryId)
  if (!entry) return
  const { feedId, sources } = entry
  const possibleSource = (sources?.concat(feedId || "") ?? []).filter((s) => !!s && s !== "feed")
  if (!possibleSource || possibleSource.length === 0) return
  return possibleSource.map((id) => getSubscriptionByFeedId(id)).find((s) => !!s)
}

export const getSubscribedFeedIdAndInboxHandlesByView = ({
  view,
  excludePrivate,
  excludeHidden,
}: {
  view: FeedViewType | undefined
  excludePrivate: boolean
  excludeHidden: boolean
}): string[] => {
  if (typeof view !== "number") return []
  const state = useSubscriptionStore.getState()

  const feedIds = Array.from(state.feedIdByView[view])
    .filter((i) => !excludePrivate || !state.data[i]?.isPrivate)
    .filter((i) => !excludeHidden || !state.data[i]?.hideFromTimeline)

  const inboxIds = view === FeedViewType.Articles ? getInboxList().map((i) => i.id) : []

  const listFeedIds = Array.from(state.listIdByView[view])
    .filter((i) => !excludePrivate || !state.data[i]?.isPrivate)
    .filter((i) => !excludeHidden || !state.data[i]?.hideFromTimeline)
    .flatMap((id) => getListFeedIds(id) ?? [])

  // Use Set to remove duplicates when feeds exist in both subscriptions and lists
  return Array.from(new Set([...feedIds, ...inboxIds, ...listFeedIds]))
}

export const getSubscribedFeedIdsByView = (view: FeedViewType): string[] => {
  const state = useSubscriptionStore.getState()
  return Array.from(state.feedIdByView[view])
}

export const getSubscriptionByCategory = ({
  category,
  view,
}: {
  category: string
  view: FeedViewType
}): string[] => {
  const state = useSubscriptionStore.getState()

  const ids = [] as string[]
  for (const id of Object.keys(state.data)) {
    const subscriptionCategory = state.data[id]
      ? state.data[id].category || getDefaultCategory(state.data[id])
      : null
    if (subscriptionCategory === category && state.data[id]!.view === view) {
      ids.push(id)
    }
  }
  return ids
}

export const getFolderFeedsByFeedId = ({ feedId, view }: { feedId?: string; view: FeedViewType }) =>
  folderFeedsByFeedIdSelector({ feedId, view })(useSubscriptionStore.getState())

export const getCategoryFeedIds = (category: string, view: FeedViewType): string[] => {
  const feedIds = [] as string[]
  const state = useSubscriptionStore.getState()
  for (const id of state.feedIdByView[view].keys()) {
    const subscription = state.data[id]
    if (!subscription) continue
    if (
      subscription.view === view &&
      (subscription.category === category || getDefaultCategory(subscription) === category)
    ) {
      feedIds.push(id)
    }
  }
  return feedIds
}

// Utility functions for creating getters
type StateType = ReturnType<typeof useSubscriptionStore.getState>
const getState = () => useSubscriptionStore.getState()

// Helper functions for sorting
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

const sortByUnread = (leftSubscriptionId: string, rightSubscriptionId: string) => {
  const leftSubscription = getSubscriptionById(leftSubscriptionId)
  const rightSubscription = getSubscriptionById(rightSubscriptionId)

  const nextLeftSubscriptionId = leftSubscription?.feedId || leftSubscription?.listId
  const nextRightSubscriptionId = rightSubscription?.feedId || rightSubscription?.listId

  if (!nextLeftSubscriptionId || !nextRightSubscriptionId) return 0
  return getUnreadById(nextRightSubscriptionId) - getUnreadById(nextLeftSubscriptionId)
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

// Store selector functions (for React hooks)
export const getSubscriptionIdsByViewSelector = (state: StateType) => (view: FeedViewType) => {
  const feedIds = Array.from(state.feedIdByView[view])
  const inboxIds = view === FeedViewType.Articles ? getInboxList().map((i) => i.id) : []
  const listFeedIds = Array.from(state.listIdByView[view]).flatMap((id) => getListFeedIds(id) ?? [])

  // Use Set to remove duplicates when feeds exist in both subscriptions and lists
  return Array.from(new Set([...feedIds, ...inboxIds, ...listFeedIds]))
}

export const getFeedSubscriptionIdsByViewSelector =
  (state: StateType) => (view: FeedViewType | undefined) => {
    return typeof view === "number" ? Array.from(state.feedIdByView[view]) : []
  }

export const getFeedSubscriptionByViewSelector = (state: StateType) => (view: FeedViewType) => {
  return Array.from(state.feedIdByView[view])
    .map((feedId) => state.data[feedId])
    .filter((feed) => !!feed)
}

export const getListSubscriptionByViewSelector = (state: StateType) => (view: FeedViewType) => {
  return Array.from(state.listIdByView[view])
    .map((listId) => state.data[listId])
    .filter((list) => !!list)
}

export const getGroupedSubscriptionSelector =
  (state: StateType) =>
  ({ view, autoGroup }: { view: FeedViewType; autoGroup: boolean }) => {
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
  }

export const getSortedGroupedSubscriptionSelector =
  (_state: StateType) =>
  ({
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
  }

export const getSortedUngroupedSubscriptionSelector =
  (_state: StateType) =>
  ({
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
  }

export const getSortedFeedSubscriptionByAlphabetSelector =
  (_state: StateType) => (ids: string[]) => {
    return ids.sort((a, b) => {
      const leftFeed = getFeedById(a)
      const rightFeed = getFeedById(b)
      if (!leftFeed || !rightFeed) return 0
      return sortByAlphabet(leftFeed.title!, rightFeed.title!)
    })
  }

export const getSubscriptionByIdSelector =
  (state: StateType) => (id: string | undefined | null) => {
    return id ? state.data[id] : undefined
  }

export const getSubscriptionsByIdsSelector = (state: StateType) => (ids: string[]) => {
  return ids.map((id) => state.data[id])
}

export const getAllListSubscriptionSelector = (state: StateType) => () => {
  return Object.values(state.listIdByView).flatMap((list) => Array.from(list))
}

export const getListSubscriptionSelector = (state: StateType) => (view: FeedViewType) => {
  return Array.from(state.listIdByView[view]).map((listId) => state.data[listId])
}

export const getListSubscriptionIdsSelector = (state: StateType) => (view: FeedViewType) => {
  return Array.from(state.listIdByView[view])
}

export const getFeedSubscriptionSelector = (state: StateType) => (view: FeedViewType) => {
  return Array.from(state.feedIdByView[view]).map((feedId) => state.data[feedId])
}

export const getFeedSubscriptionIdsSelector = (state: StateType) => (view: FeedViewType) => {
  return Array.from(state.feedIdByView[view])
}

export const getAllFeedSubscriptionSelector = (state: StateType) => () => {
  return Object.values(state.feedIdByView).flatMap((feedId) =>
    Array.from(feedId)
      .map((id) => state.data[id])
      .filter((feed) => !!feed),
  )
}

export const getAllFeedSubscriptionIdsSelector = (state: StateType) => () => {
  return Object.values(state.feedIdByView).flatMap((feedId) => Array.from(feedId))
}

export const getAllSubscriptionSelector = (state: StateType) => () => {
  return Object.values(state.data).filter((subscription) => !!subscription)
}

export const getSortedListSubscriptionSelector =
  (_state: StateType) =>
  ({
    ids,
    sortBy,
    hideAllReadSubscriptions,
  }: {
    ids: string[]
    sortBy: "alphabet" | "unread"
    hideAllReadSubscriptions: boolean
  }) => {
    return ids
      .concat()
      .filter((id) => !hideAllReadSubscriptions || getUnreadByListId(id) > 0)
      .sort((a, b) => {
        const leftList = getListById(a)
        const rightList = getListById(b)
        if (!leftList || !rightList) return 0
        if (sortBy === "alphabet") {
          return sortByAlphabet(leftList.title || "", rightList.title || "")
        }
        return sortByUnread(a, b)
      })
  }

export const getCategoriesSelector = (state: StateType) => (view?: FeedViewType) => {
  return view === undefined
    ? Array.from(
        new Set(Object.values(state.categories).flatMap((category) => Array.from(category))),
      )
    : Array.from(state.categories[view])
}

export const getSubscriptionCategoryExistSelector =
  (state: StateType) => (categoryId: string | undefined | null) => {
    if (!categoryId) return false
    return Object.values(state.categories).some((category) => category.has(categoryId))
  }

export const getCategoriesByViewSelector = (state: StateType) => (view: FeedViewType) => {
  return state.categories[view]
}

export const getListSubscriptionCountSelector = (state: StateType) => () => {
  return Array.from(state.subscriptionIdSet).filter((id) => id.startsWith("list/")).length
}

export const getFeedSubscriptionCountSelector = (state: StateType) => () => {
  return Array.from(state.subscriptionIdSet).filter((id) => id.startsWith("feed/")).length
}

export const getIsSubscribedSelector = (state: StateType) => (id: string | undefined) => {
  if (!id) return false
  return (
    state.subscriptionIdSet.has(id) ||
    state.subscriptionIdSet.has(`feed/${id}`) ||
    state.subscriptionIdSet.has(`list/${id}`) ||
    state.subscriptionIdSet.has(`inbox/${id}`)
  )
}

export const getIsListSubscriptionSelector = (state: StateType) => (id: string | undefined) => {
  if (!id) return false
  return state.subscriptionIdSet.has(`list/${id}`)
}

export const getNonPrivateSubscriptionIdsSelector = (state: StateType) => (ids: string[]) => {
  return ids
    .map((id) => state.data[id])
    .filter((s) => !s?.isPrivate)
    .map((s) => s?.listId || s?.feedId)
    .filter((id) => typeof id === "string")
}

export const getCategoryOpenStateByViewSelector = (state: StateType) => (view: FeedViewType) => {
  return state.categoryOpenStateByView[view]
}

// Static getters for use outside React components
export const getSubscriptionIdsByView = createSingleArgGetter(
  getState,
  getSubscriptionIdsByViewSelector,
)
export const getFeedSubscriptionIdsByView = createSingleArgGetter(
  getState,
  getFeedSubscriptionIdsByViewSelector,
)
export const getFeedSubscriptionByView = createSingleArgGetter(
  getState,
  getFeedSubscriptionByViewSelector,
)
export const getListSubscriptionByView = createSingleArgGetter(
  getState,
  getListSubscriptionByViewSelector,
)
export const getGroupedSubscription = createSingleArgGetter(
  getState,
  getGroupedSubscriptionSelector,
)
export const getSortedGroupedSubscription = createSingleArgGetter(
  getState,
  getSortedGroupedSubscriptionSelector,
)
export const getSortedUngroupedSubscription = createSingleArgGetter(
  getState,
  getSortedUngroupedSubscriptionSelector,
)
export const getSortedFeedSubscriptionByAlphabet = createSingleArgGetter(
  getState,
  getSortedFeedSubscriptionByAlphabetSelector,
)
export const getSubscriptionByIdStatic = createSingleArgGetter(
  getState,
  getSubscriptionByIdSelector,
)
export const getSubscriptionsByIds = createSingleArgGetter(getState, getSubscriptionsByIdsSelector)
export const getAllListSubscription = createStaticGetter(getState, getAllListSubscriptionSelector)
export const getListSubscription = createSingleArgGetter(getState, getListSubscriptionSelector)
export const getListSubscriptionIds = createSingleArgGetter(
  getState,
  getListSubscriptionIdsSelector,
)
export const getFeedSubscription = createSingleArgGetter(getState, getFeedSubscriptionSelector)
export const getFeedSubscriptionIds = createSingleArgGetter(
  getState,
  getFeedSubscriptionIdsSelector,
)
export const getAllFeedSubscription = createStaticGetter(getState, getAllFeedSubscriptionSelector)
export const getAllFeedSubscriptionIds = createStaticGetter(
  getState,
  getAllFeedSubscriptionIdsSelector,
)
export const getAllSubscription = createStaticGetter(getState, getAllSubscriptionSelector)
export const getSortedListSubscription = createSingleArgGetter(
  getState,
  getSortedListSubscriptionSelector,
)
export const getCategories = createSingleArgGetter(getState, getCategoriesSelector)
export const getSubscriptionCategoryExist = createSingleArgGetter(
  getState,
  getSubscriptionCategoryExistSelector,
)
export const getCategoriesByView = createSingleArgGetter(getState, getCategoriesByViewSelector)
export const getListSubscriptionCount = createStaticGetter(
  getState,
  getListSubscriptionCountSelector,
)
export const getFeedSubscriptionCount = createStaticGetter(
  getState,
  getFeedSubscriptionCountSelector,
)
export const getIsSubscribed = createSingleArgGetter(getState, getIsSubscribedSelector)
export const getIsListSubscription = createSingleArgGetter(getState, getIsListSubscriptionSelector)
export const getNonPrivateSubscriptionIds = createSingleArgGetter(
  getState,
  getNonPrivateSubscriptionIdsSelector,
)
export const getCategoryOpenStateByView = createSingleArgGetter(
  getState,
  getCategoryOpenStateByViewSelector,
)
