import { FeedViewType } from "@follow/constants"
import { SubscriptionService } from "@follow/database/services/subscription"
import { tracker } from "@follow/tracker"
import { omit } from "es-toolkit"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { apiMorph } from "../../morph/api"
import { dbStoreMorph } from "../../morph/db-store"
import { buildSubscriptionDbId, storeDbMorph } from "../../morph/store-db"
import { invalidateEntriesQuery } from "../entry/hooks"
import { getFeedById } from "../feed/getter"
import { feedActions } from "../feed/store"
import { inboxActions } from "../inbox/store"
import { getListById } from "../list/getters"
import { listActions } from "../list/store"
import { unreadActions } from "../unread/store"
import { whoami } from "../user/getters"
import { getCategoryFeedIds } from "./getter"
import type { SubscriptionForm, SubscriptionModel } from "./types"
import { getDefaultCategory, getSubscriptionDBId, getSubscriptionStoreId } from "./utils"

type FeedId = string
type ListId = string

export interface SubscriptionState {
  /**
   * Key: FeedId, ListId, `inbox/${inboxId}`
   * Value: SubscriptionPlainModel
   */
  data: Record<string, SubscriptionModel>

  feedIdByView: Record<FeedViewType, Set<FeedId>>

  listIdByView: Record<FeedViewType, Set<ListId>>

  /**
   * All named categories names set
   */
  categories: Record<FeedViewType, Set<string>>
  /**
   * All subscription ids set
   */
  subscriptionIdSet: Set<string>

  categoryOpenStateByView: Record<FeedViewType, Record<string, boolean>>
}

const emptyDataSetByView: Record<FeedViewType, Set<FeedId>> = {
  [FeedViewType.Articles]: new Set(),
  [FeedViewType.Audios]: new Set(),
  [FeedViewType.Notifications]: new Set(),
  [FeedViewType.Pictures]: new Set(),
  [FeedViewType.SocialMedia]: new Set(),
  [FeedViewType.Videos]: new Set(),
}
const emptyCategoryOpenStateByView: Record<FeedViewType, Record<string, boolean>> = {
  [FeedViewType.Articles]: {},
  [FeedViewType.Audios]: {},
  [FeedViewType.Notifications]: {},
  [FeedViewType.Pictures]: {},
  [FeedViewType.SocialMedia]: {},
  [FeedViewType.Videos]: {},
}

const defaultState: SubscriptionState = {
  data: {},
  feedIdByView: { ...emptyDataSetByView },
  listIdByView: { ...emptyDataSetByView },
  categories: { ...emptyDataSetByView },
  subscriptionIdSet: new Set(),
  categoryOpenStateByView: { ...emptyCategoryOpenStateByView },
}
export const useSubscriptionStore = createZustandStore<SubscriptionState>("subscription")(
  () => defaultState,
)

const get = useSubscriptionStore.getState

const immerSet = createImmerSetter(useSubscriptionStore)
class SubscriptionActions implements Hydratable, Resetable {
  async hydrate() {
    const subscriptions = await SubscriptionService.getSubscriptionAll()
    subscriptionActions.upsertManyInSession(
      subscriptions.map((s) => dbStoreMorph.toSubscriptionModel(s)),
    )
  }
  async upsertManyInSession(subscriptions: SubscriptionModel[]) {
    immerSet((draft) => {
      for (const subscription of subscriptions) {
        const subscriptionSetId = getSubscriptionDBId(subscription)
        const subscriptionStoreId = getSubscriptionStoreId(subscription)

        draft.data[subscriptionStoreId] = subscription
        draft.subscriptionIdSet.add(subscriptionSetId)

        if (subscription.feedId && subscription.type === "feed") {
          draft.feedIdByView[subscription.view].add(subscription.feedId)
          if (subscription.category) {
            draft.categories[subscription.view].add(subscription.category)
          }
        }
        if (subscription.listId && subscription.type === "list") {
          draft.listIdByView[subscription.view].add(subscription.listId)
        }
      }
    })
  }
  async upsertMany(
    subscriptions: SubscriptionModel[],
    options: { resetBeforeUpsert?: boolean | FeedViewType } = {},
  ) {
    const tx = createTransaction()
    tx.store(() => {
      if (options.resetBeforeUpsert !== undefined) {
        if (typeof options.resetBeforeUpsert === "boolean") {
          this.reset()
        } else {
          this.resetByView(options.resetBeforeUpsert)
        }
      }
      this.upsertManyInSession(subscriptions)
    })

    tx.persist(() => {
      return SubscriptionService.upsertMany(
        subscriptions.map((s) => storeDbMorph.toSubscriptionSchema(s)),
      )
    })

    await tx.run()
  }

  resetByView(view: FeedViewType) {
    immerSet((draft) => {
      draft.feedIdByView[view] = new Set()
      draft.listIdByView[view] = new Set()
      draft.categories[view] = new Set()
      draft.subscriptionIdSet = new Set()
    })
  }

  toggleCategoryOpenState(view: FeedViewType, category: string) {
    immerSet((state) => {
      state.categoryOpenStateByView[view][category] = !state.categoryOpenStateByView[view][category]
    })
  }

  changeCategoryOpenState(view: FeedViewType, category: string, status: boolean) {
    immerSet((state) => {
      state.categoryOpenStateByView[view][category] = status
    })
  }

  expandCategoryOpenStateByView(view: FeedViewType, isOpen: boolean) {
    immerSet((state) => {
      for (const category in state.categoryOpenStateByView[view]) {
        state.categoryOpenStateByView[view][category] = isOpen
      }
    })
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      // set(defaultState)
      immerSet((draft) => {
        Object.assign(draft, omit(defaultState, ["categoryOpenStateByView"]))
      })
    })

    tx.persist(() => {
      return SubscriptionService.reset()
    })

    await tx.run()
  }
}

class SubscriptionSyncService {
  async fetch(view?: FeedViewType) {
    const { data } = await api().subscriptions.get({
      view: view !== undefined ? view : undefined,
    })

    const { subscriptions, collections } = apiMorph.toSubscription(data)

    feedActions.upsertMany(collections.feeds)
    subscriptionActions.upsertMany(subscriptions, {
      resetBeforeUpsert: typeof view === "number" ? view : true,
    })
    listActions.upsertMany(collections.lists)

    inboxActions.upsertMany(collections.inboxes)

    return {
      subscriptions,
      feeds: collections.feeds,
    }
  }

  async edit(subscription: SubscriptionModel) {
    const subscriptionId = getSubscriptionStoreId(subscription)
    const current = get().data[subscriptionId]
    if (!current) {
      return
    }
    const tx = createTransaction(current)

    let addNewCategory = false
    tx.store(() => {
      immerSet((draft) => {
        if (
          subscription.category &&
          !draft.categories[subscription.view].has(subscription.category)
        ) {
          addNewCategory = true
          draft.categories[subscription.view].add(subscription.category)
        }

        if (subscription.type === "feed") {
          draft.feedIdByView[current.view].delete(current.feedId!)
          draft.feedIdByView[subscription.view].add(subscription.feedId!)
        }

        draft.data[subscriptionId] = subscription
      })
    })
    tx.rollback((current) => {
      immerSet((draft) => {
        if (addNewCategory && subscription.category) {
          draft.categories[subscription.view].delete(subscription.category)
        }

        if (subscription.type === "feed") {
          draft.feedIdByView[subscription.view].delete(subscription.feedId!)
          draft.feedIdByView[current.view].add(current.feedId!)
        }

        draft.data[subscriptionId] = current
      })
    })
    tx.request(async () => {
      await api().subscriptions.update({
        ...subscription,
        feedId: subscription.feedId ?? undefined,
        listId: subscription.listId ?? undefined,
      })
    })

    tx.persist(() => {
      return SubscriptionService.patch(storeDbMorph.toSubscriptionSchema(subscription))
    })

    await tx.run()

    invalidateEntriesQuery({ views: [subscription.view] })
  }

  async subscribe(subscription: SubscriptionForm) {
    const data = await api().subscriptions.create(subscription)

    if (data.feed) {
      feedActions.upsertMany([data.feed])
      tracker.subscribe({ feedId: data.feed.id, view: subscription.view })
    }

    if (data.list) {
      listActions.upsertMany([
        {
          ...data.list,
          userId: data.list.ownerUserId,
          type: "list",
          subscriptionCount: null,
          purchaseAmount: null,
        },
      ])
      tracker.subscribe({ listId: data.list.id, view: subscription.view })
    }

    if (data.unread) {
      unreadActions.upsertMany(data.unread)
    }

    // Insert to subscription
    await subscriptionActions.upsertMany([
      {
        ...subscription,
        title: subscription.title ?? null,
        category: subscription.category ?? null,

        type: data.list ? "list" : "feed",
        createdAt: new Date().toISOString(),
        feedId: data.feed?.id ?? null,
        listId: data.list?.id ?? null,
        inboxId: null,
        userId: whoami()?.id ?? "",
      },
    ])

    invalidateEntriesQuery({ views: [subscription.view] })
  }

  async unsubscribe(id: string | undefined | null | (string | undefined | null)[]) {
    const normalizedIds = (Array.isArray(id) ? id : [id]).filter((i) => typeof i === "string")
    const subscriptionList = normalizedIds.map((id) => get().data[id]).filter((i) => !!i)
    const feedsAndLists = normalizedIds
      .map((id) => getFeedById(id) ?? getListById(id))
      .filter((i) => !!i)
    if (subscriptionList.length === 0) return feedsAndLists

    const feedSubscriptions = subscriptionList.filter((i) => i.type === "feed")
    const listSubscriptions = subscriptionList.filter((i) => i.type === "list")

    const tx = createTransaction(subscriptionList)

    tx.store(() => {
      immerSet((draft) => {
        for (const id of normalizedIds) {
          const subscription = draft.data[id]
          if (!subscription) continue
          draft.subscriptionIdSet.delete(getSubscriptionDBId(subscription))
          if (subscription.feedId) draft.feedIdByView[subscription.view].delete(subscription.feedId)
          if (subscription.listId) draft.listIdByView[subscription.view].delete(subscription.listId)
          if (subscription.category)
            draft.categories[subscription.view].delete(subscription.category)
          delete draft.data[id]
        }
      })
    })

    tx.request(async () => {
      const feedIdList = feedSubscriptions.map((s) => s.feedId).filter((i) => typeof i === "string")
      await api().subscriptions.delete({
        feedIdList: feedIdList.length > 0 ? feedIdList : undefined,
        listId: listSubscriptions.at(0)?.listId || undefined,
      })
    })

    tx.rollback((current) => {
      immerSet((draft) => {
        for (const [index, id] of normalizedIds.entries()) {
          const subscription = current[index]
          if (!subscription) continue

          draft.data[id] = subscription

          draft.subscriptionIdSet.add(getSubscriptionDBId(subscription))
          if (subscription.feedId) draft.feedIdByView[subscription.view].add(subscription.feedId)
          if (subscription.listId) draft.listIdByView[subscription.view].add(subscription.listId)
          if (subscription.category) draft.categories[subscription.view].add(subscription.category)
        }
      })
    })

    tx.persist(() => {
      return SubscriptionService.delete(subscriptionList.map((i) => buildSubscriptionDbId(i)))
    })

    await tx.run()
    invalidateEntriesQuery({
      views: Array.from(new Set([...feedSubscriptions, ...listSubscriptions].map((i) => i.view))),
    })

    feedSubscriptions.forEach((i) => {
      unreadActions.updateById(i.feedId, 0)
    })
    return feedsAndLists
  }

  async batchUpdateSubscription({
    feedIds,
    category: newCategory,
    view: newView,
  }: {
    feedIds: string[]
    category?: string | null
    view: FeedViewType
  }) {
    const current = feedIds
      .map((id) => get().data[id])
      .map((i) =>
        i
          ? {
              view: i.view,
              category: i.category,
            }
          : null,
      )

    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        for (const feedId of feedIds) {
          const subscription = draft.data[feedId]
          if (!subscription) continue

          const currentView = subscription.view
          draft.feedIdByView[currentView].delete(feedId)
          draft.feedIdByView[newView].add(feedId)
          subscription.view = newView

          if (newCategory) {
            draft.categories[newView].add(newCategory)
            subscription.category = newCategory
          }
        }
      })
    })

    tx.request(async () => {
      await api().subscriptions.batchUpdate({
        feedIds,
        category: newCategory,
        view: newView,
      })
    })

    tx.rollback(() => {
      immerSet((draft) => {
        for (const [index, feedId] of feedIds.entries()) {
          const subscription = draft.data[feedId]
          if (!subscription) continue
          if (!current[index]) continue

          subscription.view = current[index].view
          draft.feedIdByView[newView].delete(feedId)
          draft.feedIdByView[current[index].view].add(feedId)

          if (newCategory) {
            const currentCategory = current[index].category
            subscription.category = currentCategory
          }
        }
      })
    })

    tx.persist(() => {
      return SubscriptionService.patchMany({
        feedIds,
        data: {
          view: newView,
          category: newCategory,
        },
      })
    })

    await tx.run()
  }

  async changeListView({ listId, view }: { listId: string; view: FeedViewType }) {
    const current = get().data[listId]
    if (!current) {
      return
    }

    const currentView = current.view
    const newView = view

    const tx = createTransaction(current)
    tx.store(() => {
      immerSet((draft) => {
        if (!draft.data[listId]) {
          return
        }

        draft.data[listId].view = newView
        draft.listIdByView[currentView].delete(listId)
        draft.listIdByView[newView].add(listId)
      })
    })

    tx.request(async () => {
      await api().subscriptions.update({
        view,
        listId,
      })
    })

    tx.rollback((current) => {
      immerSet((draft) => {
        if (!draft.data[listId]) {
          return
        }

        draft.data[listId].view = current.view
        draft.listIdByView[newView].delete(listId)
        draft.listIdByView[currentView].add(listId)
      })
    })

    tx.persist(() => {
      return SubscriptionService.patch(
        storeDbMorph.toSubscriptionSchema({
          ...current,
          view,
        }),
      )
    })

    await tx.run()
  }

  async deleteCategory({ category, view }: { category: string; view: FeedViewType }) {
    const feedIds = getCategoryFeedIds(category, view)

    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        for (const feedId of feedIds) {
          const subscription = draft.data[feedId]
          if (!subscription) continue
          subscription.category = null
        }
        draft.categories[view].delete(category)
      })
    })

    tx.request(async () => {
      await api().categories.delete({
        feedIdList: feedIds,
        deleteSubscriptions: false,
      })
    })

    tx.rollback(() => {
      immerSet((draft) => {
        for (const feedId of feedIds) {
          const subscription = draft.data[feedId]
          if (!subscription) continue
          subscription.category = category
        }

        draft.categories[view].add(category)
      })
    })

    tx.persist(() => {
      return SubscriptionService.patchMany({
        feedIds,
        data: {
          category: null,
        },
      })
    })

    await tx.run()
  }

  async changeCategoryView({
    category,
    currentView,
    newView,
  }: {
    category: string
    currentView: FeedViewType
    newView: FeedViewType
  }) {
    const folderFeedIds = getCategoryFeedIds(category, currentView)

    await this.batchUpdateSubscription({
      feedIds: folderFeedIds,
      view: newView,
    })

    invalidateEntriesQuery({
      views: [currentView, newView],
    })
  }

  async renameCategory({
    lastCategory,
    newCategory,
    view,
  }: {
    lastCategory: string
    newCategory: string
    view: FeedViewType
  }) {
    const feedIds = getCategoryFeedIds(lastCategory, view)

    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        for (const id of feedIds) {
          const subscription = draft.data[id]
          if (!subscription) continue
          subscription.category = newCategory
        }
        draft.categories[view].add(newCategory)
        draft.categories[view].delete(lastCategory)

        const lastCategoryOpenState = draft.categoryOpenStateByView[view][lastCategory]
        if (typeof lastCategoryOpenState === "boolean") {
          draft.categoryOpenStateByView[view][newCategory] = lastCategoryOpenState
          delete draft.categoryOpenStateByView[view][lastCategory]
        }
      })
    })

    tx.request(async () => {
      await api().categories.update({
        feedIdList: feedIds,
        category: newCategory,
      })
    })

    tx.rollback(() => {
      immerSet((draft) => {
        for (const id of feedIds) {
          const subscription = draft.data[id]
          if (!subscription) continue
          const defaultCategory = getDefaultCategory(subscription)
          subscription.category = lastCategory !== defaultCategory ? lastCategory : null
        }
        draft.categories[view].delete(newCategory)
        draft.categories[view].add(lastCategory)

        const lastCategoryOpenState = draft.categoryOpenStateByView[view][newCategory]
        if (typeof lastCategoryOpenState === "boolean") {
          draft.categoryOpenStateByView[view][lastCategory] = lastCategoryOpenState
          delete draft.categoryOpenStateByView[view][newCategory]
        }
      })
    })

    tx.persist(() => {
      return SubscriptionService.patchMany({
        feedIds,
        data: {
          category: newCategory,
        },
      })
    })

    await tx.run()
  }
}

export const subscriptionActions = new SubscriptionActions()
export const subscriptionSyncService = new SubscriptionSyncService()
