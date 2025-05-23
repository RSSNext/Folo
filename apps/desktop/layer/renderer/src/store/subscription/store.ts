import { FeedViewType } from "@follow/constants"
import type {
  FeedModel,
  InboxModel,
  ListModelPoplutedFeeds,
  SubscriptionModel,
} from "@follow/models/types"
import { capitalizeFirstLetter, omitShallow } from "@follow/utils/utils"
import { produce } from "immer"
import { parse } from "tldts"

import { setFeedUnreadDirty } from "~/atoms/feed"
import { whoami } from "~/atoms/user"
import { getInboxIdWithPrefix } from "~/constants"
import { runTransactionInScope } from "~/database"
import { apiClient } from "~/lib/api-fetch"
import { queryClient } from "~/lib/query-client"
import { updateFeedBoostStatus } from "~/modules/boost/atom"
import { Queries } from "~/queries"
import { SubscriptionService } from "~/services"

import { entryActions } from "../entry"
import { feedActions, getFeedById } from "../feed"
import { inboxActions } from "../inbox"
import { getListById, listActions } from "../list"
import { unreadActions } from "../unread"
import { createImmerSetter, createTransaction, createZustandStore } from "../utils/helper"

export type SubscriptionFlatModel = Omit<SubscriptionModel, "feeds"> & {
  defaultCategory?: string

  listId?: string
  inboxId?: string
}
interface SubscriptionState {
  /**
   * Key: feedId
   * Value: SubscriptionPlainModel
   */
  data: Record<FeedId, SubscriptionFlatModel>
  /**
   * Key: FeedViewType
   * Value: FeedId[]
   */
  feedIdByView: Record<FeedViewType, FeedId[]>
  /**
   * Key: FeedViewType
   * Value: Record<string, boolean>
   */
  categoryOpenStateByView: Record<FeedViewType, Record<string, boolean>>
  /**
   * All named categories names set
   */
  categories: Set<string>
  /**
   * All list ids set
   */
  listIds: Set<string>
  /**
   * All inbox ids set
   */
  inboxIds: Set<string>
}

function morphResponseData(data: SubscriptionModel[]): SubscriptionFlatModel[] {
  const result: SubscriptionFlatModel[] = []
  for (const subscription of data) {
    const cloned: SubscriptionFlatModel = { ...subscription }
    if (!subscription.category && "feeds" in subscription && subscription.feeds) {
      const { siteUrl } = subscription.feeds
      if (!siteUrl) {
        cloned.defaultCategory = subscription.feedId
      } else {
        const parsed = parse(siteUrl)

        if (parsed.domain) {
          cloned.defaultCategory = capitalizeFirstLetter(parsed.domain)
        } else {
          cloned.defaultCategory = subscription.feedId
        }
      }
    }
    result.push(cloned)
  }
  return result
}

const emptyDataIdByView: Record<FeedViewType, FeedId[]> = {
  [FeedViewType.Articles]: [],
  [FeedViewType.Audios]: [],
  [FeedViewType.Notifications]: [],
  [FeedViewType.Pictures]: [],
  [FeedViewType.SocialMedia]: [],
  [FeedViewType.Videos]: [],
}
const emptyCategoryOpenStateByView: Record<FeedViewType, Record<string, boolean>> = {
  [FeedViewType.Articles]: {},
  [FeedViewType.Audios]: {},
  [FeedViewType.Notifications]: {},
  [FeedViewType.Pictures]: {},
  [FeedViewType.SocialMedia]: {},
  [FeedViewType.Videos]: {},
}

export const useSubscriptionStore = createZustandStore<SubscriptionState>("subscription")(() => ({
  data: {},
  feedIdByView: { ...emptyDataIdByView },
  categoryOpenStateByView: { ...emptyCategoryOpenStateByView },
  categories: new Set(),
  listIds: new Set(),
  inboxIds: new Set(),
}))

const set = useSubscriptionStore.setState
const get = useSubscriptionStore.getState
const immerSet = createImmerSetter(useSubscriptionStore)

type MarkReadFilter = {
  startTime: number
  endTime: number
}
let subscribeOnce = false
class SubscriptionActions {
  constructor() {
    if (subscribeOnce) return
    subscribeOnce = true

    useSubscriptionStore.subscribe((state, prev) => {
      if (state.data === prev.data) return

      const categories = new Set<string>()
      for (const subscription of Object.values(state.data)) {
        subscription.category && categories.add(subscription.category)
      }
      set((state) => ({
        ...state,
        categories,
      }))
    })
  }
  async fetchByView(view?: FeedViewType) {
    const res = await apiClient.subscriptions.$get({
      query: {
        view: view !== undefined ? String(view) : undefined,
      },
    })

    // reset dataIdByView
    if (view !== undefined) {
      set((state) => ({
        ...state,
        feedIdByView: { ...state.feedIdByView, [view]: [] },
      }))
    } else {
      set((state) => ({
        ...state,
        feedIdByView: { ...emptyDataIdByView },
      }))
    }

    const transformedData = morphResponseData(res.data)

    this.upsertMany(transformedData)

    const feeds = [] as FeedModel[]
    const lists = [] as ListModelPoplutedFeeds[]
    const inboxes = [] as InboxModel[]
    for (const subscription of res.data) {
      if ("feeds" in subscription) {
        feeds.push(subscription.feeds)
      } else if ("lists" in subscription) {
        lists.push(subscription.lists)
      } else if ("inboxes" in subscription) {
        inboxes.push(subscription.inboxes)
      }

      if ("boost" in subscription) {
        updateFeedBoostStatus(subscription.feedId, subscription.boost.boosters.length > 0)
      }
    }

    this.updateCategoryOpenState(transformedData.filter((s) => s.category || s.defaultCategory))
    feedActions.upsertMany(feeds)
    listActions.upsertMany(lists)
    inboxActions.upsertMany(inboxes)

    return null
  }

  upsertMany(subscriptions: SubscriptionFlatModel[]) {
    runTransactionInScope(() => {
      SubscriptionService.upsertMany(subscriptions)
    })
    immerSet((state) => {
      subscriptions.forEach((subscription) => {
        if (subscription.listId) {
          state.listIds.add(subscription.listId)
        } else if (subscription.inboxId) {
          state.inboxIds.add(subscription.inboxId)
        }
        state.data[subscription.feedId] = omitShallow(
          subscription,
          "feeds",
          "lists",
          "inboxes",
        ) as SubscriptionFlatModel
        state.feedIdByView[subscription.view].push(subscription.feedId)
      })
    })
  }

  updateCategoryOpenState(subscriptions: SubscriptionFlatModel[]) {
    immerSet((state) =>
      subscriptions.forEach((subscription) => {
        const folderName = subscription.category || subscription.defaultCategory
        state.categoryOpenStateByView[subscription.view][folderName] =
          state.categoryOpenStateByView[subscription.view][folderName] || false
        return state
      }),
    )
  }

  toggleCategoryOpenState(view: FeedViewType, category: string) {
    immerSet(
      (state) =>
        (state.categoryOpenStateByView[view][category] =
          !state.categoryOpenStateByView[view][category]),
    )
  }

  changeCategoryOpenState(view: FeedViewType, category: string, status: boolean) {
    immerSet((state) => (state.categoryOpenStateByView[view][category] = status))
  }

  expandCategoryOpenStateByView(view: FeedViewType, isOpen: boolean) {
    immerSet((state) => {
      for (const category in state.categoryOpenStateByView[view]) {
        state.categoryOpenStateByView[view][category] = isOpen
      }
    })
  }

  async markReadByView({
    view,
    excludePrivate,
    filter,
  }: {
    view: FeedViewType
    excludePrivate?: boolean
    filter?: MarkReadFilter
  }) {
    const tx = createTransaction()

    tx.execute(async () => {
      const { data } = await apiClient.reads.all.$post({
        json: {
          view,
          excludePrivate,
          ...filter,
        },
      })
      if (filter) {
        unreadActions.changeBatch(data.read, "decrement")
      }
    })

    const feedIds = [] as string[]
    tx.optimistic(async () => {
      const state = get()
      for (const feedId in state.data) {
        if (excludePrivate && state.data[feedId]?.isPrivate) {
          continue
        }
        if (state.data[feedId]!.view === view) {
          if (state.data[feedId]?.listId) {
            const listFeedIds = getListById(state.data[feedId].listId)?.feedIds
            if (listFeedIds) {
              feedIds.push(...listFeedIds)

              listFeedIds.forEach((id) => {
                !filter && unreadActions.updateById(id, 0)
                entryActions.patchManyById(id, { read: true }, filter)
              })
            }
          } else {
            feedIds.push(feedId)
            // We can not process this logic in local, so skip it. and then we will fetch the unread count from server.
            !filter && unreadActions.updateById(feedId, 0)
            entryActions.patchManyById(feedId, { read: true }, filter)
          }
        }
      }
    })

    tx.rollback(async () => {
      // TODO handle this local?
      await Queries.subscription.unreadAll().invalidate()
    })
    await tx.run()

    for (const feedId of feedIds) {
      setFeedUnreadDirty(feedId)
    }
  }

  async markReadByIds({
    feedIds,
    inboxId,
    filter,
    listId,
  }: {
    feedIds?: string[]
    inboxId?: string
    view?: FeedViewType
    filter?: MarkReadFilter
    listId?: string
  }) {
    const stableFeedIds = feedIds?.concat() || []

    const tx = createTransaction()

    tx.execute(async () => {
      const { data } = await apiClient.reads.all.$post({
        json: {
          ...(listId
            ? {
                listId,
              }
            : inboxId
              ? {
                  inboxId,
                }
              : {
                  feedIdList: stableFeedIds,
                }),
          ...filter,
        },
      })
      if (filter) {
        unreadActions.changeBatch(data.read, "decrement")
      }
    })
    tx.optimistic(() => {
      if (listId) {
        const listFeedIds = getListById(listId)?.feedIds
        if (listFeedIds) {
          for (const feedId of listFeedIds) {
            !filter && unreadActions.updateById(feedId, 0)
            entryActions.patchManyById(feedId, { read: true }, filter)
          }
        }
      } else if (inboxId) {
        !filter && unreadActions.updateById(inboxId, 0)
        entryActions.patchManyById(getInboxIdWithPrefix(inboxId), { read: true }, filter)
      } else {
        for (const feedId of stableFeedIds) {
          // We can not process this logic in local, so skip it. and then we will fetch the unread count from server.
          !filter && unreadActions.updateById(feedId, 0)
          entryActions.patchManyById(feedId, { read: true }, filter)
        }
      }
    })

    tx.rollback(async () => {
      // TODO handle this local?
      await Queries.subscription.unreadAll().invalidate()
    })

    await tx.run()

    for (const feedId of stableFeedIds) {
      setFeedUnreadDirty(feedId)
    }
  }

  clear() {
    set({
      data: {},
      feedIdByView: { ...emptyDataIdByView },
      categoryOpenStateByView: { ...emptyCategoryOpenStateByView },
    })
  }

  async deleteCategory(ids: string[]) {
    const idSet = new Set(ids)
    const tx = createTransaction(get())

    tx.execute(async () => {
      await apiClient.categories.$delete({
        json: {
          feedIdList: ids,
          deleteSubscriptions: false,
        },
      })
    })

    tx.optimistic(async () => {
      immerSet((state) =>
        Object.keys(state.data).forEach((id) => {
          if (!idSet.has(id)) {
            return
          }
          const subscription = state.data[id]!
          const feed = getFeedById(subscription.feedId)
          if (!feed || feed.type !== "feed") return
          const { siteUrl } = feed
          if (!siteUrl) return
          const parsed = parse(siteUrl)
          subscription.category = null
          // The logic for removing Category here is to use domain as the default category name.
          parsed.domain && (subscription.defaultCategory = capitalizeFirstLetter(parsed.domain))
        }),
      )
    })

    tx.rollback(async (snapshot) => {
      immerSet((state) => {
        Object.keys(snapshot.data).forEach((id) => {
          state.data[id] = snapshot.data[id]!
        })
      })
    })

    tx.persist(async () => {
      const { data } = get()
      ids.map((id) => data[id] && SubscriptionService.upsert(data[id]))
    })
    await tx.run()
  }

  /**
   * unfollow feed or list
   */
  async unfollow(feedIds?: string[]) {
    if (!feedIds || feedIds.length === 0) return []

    const feedsAndLists = feedIds.map((id) => getFeedById(id) ?? getListById(id))

    const tx = createTransaction<
      ReturnType<typeof get>,
      {
        subscription: Record<FeedId, SubscriptionFlatModel>
        viewDeleted: Record<FeedId, FeedViewType[]>
      }
    >(get(), {
      viewDeleted: {},
      subscription: {},
    })

    tx.optimistic(async (_, ctx) => {
      // Remove feed and subscription
      set((state) =>
        produce(state, (draft) => {
          for (const feedId of feedIds) {
            const subscription = state.data[feedId]!
            ctx.subscription[feedId] = subscription

            delete draft.data[feedId]

            if (subscription.listId) {
              draft.listIds.delete(subscription.listId)
            } else if (subscription.inboxId) {
              draft.inboxIds.delete(subscription.inboxId)
            } else {
              for (const view in draft.feedIdByView) {
                const currentViewFeedIds = draft.feedIdByView[view] as string[]

                const idx = currentViewFeedIds.indexOf(feedId)

                if (idx !== -1) {
                  currentViewFeedIds.splice(idx, 1)
                  ctx.viewDeleted[feedId] = ctx.viewDeleted[feedId] || []
                  ctx.viewDeleted[feedId].push(Number.parseInt(view))
                }
              }
            }
          }
        }),
      )
    })
    tx.rollback(async (_, ctx) => {
      set((state) =>
        produce(state, (draft) => {
          for (const feedId of feedIds) {
            if (!ctx.subscription[feedId]) return
            draft.data[feedId] = ctx.subscription[feedId]

            for (const view of ctx.viewDeleted[feedId]!) {
              draft.feedIdByView[view].push(feedId)
            }
          }
        }),
      )
    })

    tx.persist(async () => {
      for (const feedId of feedIds) {
        // Remove feed's entries
        entryActions.clearByFeedId(feedId)
        // Clear feed's unread count
        unreadActions.updateById(feedId, 0)

        SubscriptionService.removeSubscription(whoami()!.id, feedId)
      }
    })
    tx.execute(async () => {
      let args: Parameters<typeof apiClient.subscriptions.$delete>[0]["json"] = {}

      if (feedIds.length === 1) {
        const subscription = feedsAndLists[0]
        if (!subscription) return

        if (subscription.type === "list") {
          args = {
            listId: feedIds[0],
          }
        } else if (subscription.type === "feed") {
          args = {
            feedId: feedIds[0],
          }
        }
      } else {
        // TODO: unfollow many lists when we have the API and UI for it
        args = {
          feedIdList: feedIds,
        }
      }

      await apiClient.subscriptions.$delete({
        json: args,
      })
    })

    await tx.run()
    return feedsAndLists
  }

  async changeCategoryView(
    category: string,
    currentView: FeedViewType,
    changeToView: FeedViewType,
  ) {
    const state = get()
    const folderFeedIds = [] as string[]
    for (const feedId of state.feedIdByView[currentView]) {
      const subscription = state.data[feedId]
      if (!subscription) continue
      if (subscription.category === category || subscription.defaultCategory === category) {
        folderFeedIds.push(feedId)
      }
    }
    await Promise.all(
      folderFeedIds.map((feedId) =>
        apiClient.subscriptions.$patch({
          json: {
            feedId,
            view: changeToView,
          },
        }),
      ),
    )

    set((state) =>
      produce(state, (state) => {
        for (const feedId of folderFeedIds) {
          const feed = state.data[feedId]
          if (feed) feed.view = changeToView
          const currentViewFeedIds = state.feedIdByView[currentView] as string[]
          const changeToViewFeedIds = state.feedIdByView[changeToView] as string[]
          currentViewFeedIds.splice(currentViewFeedIds.indexOf(feedId), 1)
          changeToViewFeedIds.push(feedId)
        }
      }),
    )

    await Promise.all(
      folderFeedIds.map((feedId) => SubscriptionService.changeView(feedId, changeToView)),
    )
  }

  async batchUpdateSubscription({
    feedIdList,
    category,
    view,
  }: {
    feedIdList: string[]
    category?: string | null
    view: FeedViewType
  }) {
    const tx = createTransaction<
      ReturnType<typeof get>,
      {
        subscription: Record<FeedId, SubscriptionFlatModel>
        feedIdByView: Record<FeedViewType, FeedId[]>
      }
    >(get(), {
      subscription: {},
      feedIdByView: {
        [FeedViewType.Articles]: [],
        [FeedViewType.Audios]: [],
        [FeedViewType.Notifications]: [],
        [FeedViewType.Pictures]: [],
        [FeedViewType.SocialMedia]: [],
        [FeedViewType.Videos]: [],
      },
    })

    tx.execute(async (snapshot) => {
      await apiClient.subscriptions.batch.$patch({
        json: {
          feedIds: feedIdList,
          category,
          view,
        },
      })
      const oldView = snapshot.data[feedIdList[0]!]!.view

      queryClient.invalidateQueries({
        predicate(query) {
          return (
            query.queryKey[0] === "entries" &&
            [oldView, view].includes(query.queryKey[2] as FeedViewType)
          )
        },
      })
    })

    tx.optimistic(async (_, ctx) => {
      set((state) =>
        produce(state, (draft) => {
          for (let i = 0; i < 6; i++) {
            ctx.feedIdByView[i] = state.feedIdByView[i]
          }

          for (const feedId of feedIdList) {
            const subscription = draft.data[feedId]
            if (!subscription) return

            subscription.category = category
            const feed = getFeedById(feedId)
            if (feed?.type === "feed" && feed.siteUrl) {
              const parsed = parse(feed.siteUrl)
              if (parsed.domain) {
                subscription.defaultCategory = capitalizeFirstLetter(parsed.domain)
              }
            }

            if (subscription.view !== view) {
              const currentViewFeedIds = draft.feedIdByView[subscription.view] as string[]
              currentViewFeedIds.splice(currentViewFeedIds.indexOf(feedId), 1)
              subscription.view = view
              const changeToViewFeedIds = draft.feedIdByView[view] as string[]
              changeToViewFeedIds.push(feedId)
            }

            ctx.subscription[feedId] = state.data[feedId]!
          }
        }),
      )
    })

    tx.rollback(async (_, ctx) => {
      set((state) =>
        produce(state, (draft) => {
          for (const feedId of feedIdList) {
            draft.data[feedId] = ctx.subscription[feedId]!
          }
          for (let i = 0; i < 6; i++) {
            draft.feedIdByView[i] = ctx.feedIdByView[i]
          }
        }),
      )
    })

    tx.persist(async () => {
      SubscriptionService.updateCategories(feedIdList, category)
      SubscriptionService.changeViews(feedIdList, view)
    })

    await tx.run()
  }

  async changeListView(listId: string, currentView: FeedViewType, toView: FeedViewType) {
    const state = get()

    const inCurrentViewIdx = state.feedIdByView[currentView].indexOf(listId)

    if (inCurrentViewIdx === -1) return
    set((state) =>
      produce(state, (state) => {
        state.feedIdByView[currentView].splice(inCurrentViewIdx, 1)
        state.feedIdByView[toView].push(listId)
      }),
    )
  }

  async renameCategory(lastCategory: string, newCategory: string) {
    const tx = createTransaction<
      unknown,
      {
        subscription: Record<FeedId, SubscriptionFlatModel>
      }
    >(
      {},
      {
        subscription: {},
      },
    )
    const subscriptionIds = [] as string[]
    const state = get()
    for (const feedId in state.data) {
      const subscription = state.data[feedId]!
      if (subscription.category === lastCategory || subscription.defaultCategory === lastCategory) {
        subscriptionIds.push(feedId)
      }
    }

    tx.execute(async () => {
      await apiClient.categories.$patch({
        json: {
          feedIdList: subscriptionIds,
          category: newCategory,
        },
      })
    })

    tx.persist(async () => {
      SubscriptionService.renameCategory(whoami()!.id, subscriptionIds, newCategory)
    })

    tx.optimistic(async (_, ctx) => {
      set((state) =>
        produce(state, (draft) => {
          for (const feedId of subscriptionIds) {
            const subscription = draft.data[feedId]
            if (subscription) {
              subscription.category = newCategory
              subscription.defaultCategory = undefined

              ctx.subscription[feedId] = state.data[feedId]!
            }
          }
        }),
      )
    })
    tx.rollback(async (_, ctx) => {
      set((state) =>
        produce(state, (draft) => {
          for (const feedId of Object.keys(ctx.subscription)) {
            draft.data[feedId] = ctx.subscription[feedId]!
          }
        }),
      )
    })

    await tx.run()
  }
}

export const subscriptionActions = new SubscriptionActions()
