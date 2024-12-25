import { FeedViewType } from "@follow/constants"

import type { SubscriptionSchema } from "@/src/database/schemas/types"
import { apiClient } from "@/src/lib/api-fetch"
import { honoMorph } from "@/src/morph/hono"
import { storeDbMorph } from "@/src/morph/store-db"
import { SubscriptionService } from "@/src/services/subscription"

import { feedActions } from "../feed/store"
import { inboxActions } from "../inbox/store"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { listActions } from "../list/store"
import { getInboxStoreId, getSubscriptionStoreId } from "./utils"

type FeedId = string
type ListId = string
type InboxId = string
export type SubscriptionModel = Omit<SubscriptionSchema, "id" | "isPrivate"> & {
  isPrivate: boolean
}
interface SubscriptionState {
  /**
   * Key: feedId
   * Value: SubscriptionPlainModel
   */
  data: Record<FeedId, SubscriptionModel>

  feedIdByView: Record<FeedViewType, Set<FeedId>>

  listIdByView: Record<FeedViewType, Set<ListId>>

  inboxIdByView: Record<FeedViewType, Set<InboxId>>
  /**
   * All named categories names set
   */
  categories: Record<FeedViewType, Set<string>>
  /**
   * All subscription ids set
   */
  subscriptionIdSet: Set<string>
}

const emptyDataSetByView: Record<FeedViewType, Set<FeedId>> = {
  [FeedViewType.Articles]: new Set(),
  [FeedViewType.Audios]: new Set(),
  [FeedViewType.Notifications]: new Set(),
  [FeedViewType.Pictures]: new Set(),
  [FeedViewType.SocialMedia]: new Set(),
  [FeedViewType.Videos]: new Set(),
}
const defaultState: SubscriptionState = {
  data: {},
  feedIdByView: { ...emptyDataSetByView },
  listIdByView: { ...emptyDataSetByView },
  inboxIdByView: { ...emptyDataSetByView },
  categories: { ...emptyDataSetByView },
  subscriptionIdSet: new Set(),
}
export const useSubscriptionStore = createZustandStore<SubscriptionState>("subscription")(
  () => defaultState,
)

const get = useSubscriptionStore.getState
const set = useSubscriptionStore.setState
const immerSet = createImmerSetter(useSubscriptionStore)
class SubscriptionActions {
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
          draft.inboxIdByView[subscription.view as FeedViewType].add(subscription.inboxId)
        }
      }
    })
  }
  async upsertMany(subscriptions: SubscriptionModel[]) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(subscriptions)
    })

    tx.persist(() => {
      return SubscriptionService.upsertMany(
        subscriptions.map((s) => storeDbMorph.toSubscriptionSchema(s)),
      )
    })

    await tx.run()
  }

  reset() {
    set(defaultState)
  }
  resetByView(view: FeedViewType) {
    immerSet((draft) => {
      draft.feedIdByView[view] = new Set()
      draft.listIdByView[view] = new Set()
      draft.inboxIdByView[view] = new Set()
      draft.categories[view] = new Set()
      draft.subscriptionIdSet = new Set()
    })
  }
}

class SubscriptionSyncService {
  async fetch(view: FeedViewType) {
    const res = await apiClient.subscriptions.$get({
      query: {
        view: view !== undefined ? String(view) : undefined,
      },
    })

    subscriptionActions.resetByView(view)

    const { subscriptions, feeds, lists, inboxes } = honoMorph.toSubscription(res.data)
    feedActions.upsertMany(feeds)
    subscriptionActions.upsertMany(subscriptions)
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
    const tx = createTransaction(current)

    let addNewCategory = false
    tx.store(() => {
      immerSet((draft) => {
        if (
          subscription.category &&
          !draft.categories[subscription.view as FeedViewType].has(subscription.category)
        ) {
          addNewCategory = true
          draft.categories[subscription.view as FeedViewType].add(subscription.category)
        }

        draft.data[subscriptionId] = subscription
      })
    })
    tx.rollback((current) => {
      immerSet((draft) => {
        if (addNewCategory && subscription.category) {
          draft.categories[subscription.view as FeedViewType].delete(subscription.category)
        }
        draft.data[subscriptionId] = current
      })
    })
    tx.request(async () => {
      await apiClient.subscriptions.$patch({
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
}

export const subscriptionActions = new SubscriptionActions()
export const subscriptionSyncService = new SubscriptionSyncService()
