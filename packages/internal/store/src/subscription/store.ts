import { FeedViewType } from "@follow/constants"
import { SubscriptionService } from "@follow/database/services/subscription"
import { UnreadService } from "@follow/database/services/unread"
import { tracker } from "@follow/tracker"

import { apiClient } from "../context"
import { getFeedById } from "../feed/getter"
import { feedActions } from "../feed/store"
import { inboxActions } from "../inbox/store"
import type { Hydratable, Resetable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { getListById } from "../list/getters"
import { listActions } from "../list/store"
import { dbStoreMorph } from "../morph/db-store"
import { honoMorph } from "../morph/hono"
import { buildSubscriptionDbId, storeDbMorph } from "../morph/store-db"
import { whoami } from "../user/getters"
import type { SubscriptionForm, SubscriptionModel } from "./types"
import { getDefaultCategory, getInboxStoreId, getSubscriptionStoreId } from "./utils"

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
        if (subscription.feedId && subscription.type === "feed") {
          draft.data[subscription.feedId] = subscription
          draft.subscriptionIdSet.add(`${subscription.type}/${subscription.feedId}`)
          draft.feedIdByView[subscription.view as FeedViewType].add(subscription.feedId)
          if (subscription.category) {
            draft.categories[subscription.view as FeedViewType].add(subscription.category)
          }
        }
        if (subscription.listId && subscription.type === "list") {
          draft.data[subscription.listId] = subscription
          draft.subscriptionIdSet.add(`${subscription.type}/${subscription.listId}`)
          draft.listIdByView[subscription.view as FeedViewType].add(subscription.listId)
        }

        if (subscription.inboxId && subscription.type === "inbox") {
          draft.data[getInboxStoreId(subscription.inboxId)] = subscription
          draft.subscriptionIdSet.add(`${subscription.type}/${subscription.inboxId}`)
        }

        const folderName = subscription.category || getDefaultCategory(subscription)
        if (!folderName) continue
        draft.categoryOpenStateByView[subscription.view][folderName] =
          draft.categoryOpenStateByView[subscription.view][folderName] || false
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
        Object.assign(draft, defaultState)
      })
    })

    tx.persist(() => {
      return UnreadService.reset()
    })

    await tx.run()
  }
}

class SubscriptionSyncService {
  async fetch(view?: FeedViewType) {
    const res = await apiClient().subscriptions.$get({
      query: {
        view: view !== undefined ? String(view) : undefined,
      },
    })

    const { subscriptions, feeds, lists, inboxes } = honoMorph.toSubscription(res.data)

    await SubscriptionService.deleteNotExists(
      subscriptions.map((s) => buildSubscriptionDbId(s)),
      view,
    )

    feedActions.upsertMany(feeds)
    subscriptionActions.upsertMany(subscriptions, {
      resetBeforeUpsert: typeof view === "number" ? view : true,
    })
    listActions.upsertMany(lists)

    inboxActions.upsertMany(inboxes)

    return {
      subscriptions,
      feeds,
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
      await apiClient().subscriptions.$patch({
        json: {
          view: subscription.view,
          feedId: subscription.feedId ?? undefined,
          isPrivate: subscription.isPrivate ?? undefined,
          listId: subscription.listId ?? undefined,
          category: subscription.category ?? undefined,
          title: subscription.title ?? undefined,
        },
      })
    })

    tx.persist(() => {
      return SubscriptionService.patch(storeDbMorph.toSubscriptionSchema(subscription))
    })

    await tx.run()
  }

  async subscribe(subscription: SubscriptionForm) {
    const data = await apiClient().subscriptions.$post({
      json: {
        url: subscription.url,
        view: subscription.view,
        category: subscription.category,
        isPrivate: subscription.isPrivate,
        title: subscription.title,
        listId: subscription.listId,
      },
    })

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
    // Insert to subscription
    subscriptionActions.upsertMany([
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
          delete draft.data[id]
          const subscription = draft.data[id]
          if (!subscription) continue
          draft.subscriptionIdSet.delete(getSubscriptionStoreId(subscription))
          if (subscription.feedId) draft.feedIdByView[subscription.view].delete(subscription.feedId)
          if (subscription.listId) draft.listIdByView[subscription.view].delete(subscription.listId)
          if (subscription.category)
            draft.categories[subscription.view].delete(subscription.category)
        }
      })
    })

    tx.request(async () => {
      const feedIdList = feedSubscriptions.map((s) => s.feedId).filter((i) => typeof i === "string")
      await apiClient().subscriptions.$delete({
        json: {
          feedIdList: feedIdList.length > 0 ? feedIdList : undefined,
          listId: listSubscriptions.at(0)?.listId || undefined,
        },
      })
    })

    tx.rollback((current) => {
      immerSet((draft) => {
        for (const [index, id] of normalizedIds.entries()) {
          const subscription = current[index]
          if (!subscription) continue

          draft.data[id] = subscription

          draft.subscriptionIdSet.add(`${subscription.type}/${subscription.feedId}`)
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
    return feedsAndLists
  }

  async batchUpdateSubscription({
    feedIds,
    category,
    view,
  }: {
    feedIds: string[]
    category?: string | null
    view: FeedViewType
  }) {
    // TODO: handle local state update
    await apiClient().subscriptions.batch.$patch({
      json: {
        feedIds,
        category,
        view,
      },
    })

    await this.fetch(view)
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
      await apiClient().subscriptions.$patch({
        json: {
          view,
          listId,
        },
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

  async deleteCategory(ids: string[]) {
    // TODO: handle local state update
    await apiClient().categories.$delete({
      json: {
        feedIdList: ids,
        deleteSubscriptions: false,
      },
    })

    this.fetch()
  }

  async changeCategoryView(
    category: string,
    currentView: FeedViewType,
    changeToView: FeedViewType,
  ) {
    // TODO: handle local state update
    const state = get()
    const folderFeedIds = [] as string[]
    for (const feedId of state.feedIdByView[currentView]) {
      const subscription = state.data[feedId]
      if (!subscription) continue
      if (subscription.category === category || getDefaultCategory(subscription) === category) {
        folderFeedIds.push(feedId)
      }
    }
    await Promise.all(
      folderFeedIds.map((feedId) =>
        apiClient().subscriptions.$patch({
          json: {
            feedId,
            view: changeToView,
          },
        }),
      ),
    )
  }

  async renameCategory(lastCategory: string, newCategory: string) {
    // TODO: handle local state update
    const subscriptionIds = [] as string[]
    const state = get()
    for (const feedId in state.data) {
      const subscription = state.data[feedId]!
      if (
        subscription.category === lastCategory ||
        getDefaultCategory(subscription) === lastCategory
      ) {
        subscriptionIds.push(feedId)
      }
    }

    await apiClient().categories.$patch({
      json: {
        feedIdList: subscriptionIds,
        category: newCategory,
      },
    })

    await this.fetch()
  }
}

export const subscriptionActions = new SubscriptionActions()
export const subscriptionSyncService = new SubscriptionSyncService()
