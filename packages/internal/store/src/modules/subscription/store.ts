import { FeedViewType } from "@follow/constants"
import { SubscriptionService } from "@follow/database/services/subscription"
import { tracker } from "@follow/tracker"
import type { WithLastSyncId } from "@follow-app/client-sdk"
import { omit } from "es-toolkit"
import { t } from "i18next"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { apiMorph } from "../../morph/api"
import { dbStoreMorph } from "../../morph/db-store"
import { buildSubscriptionDbId, storeDbMorph } from "../../morph/store-db"
import {
  isSubscriptionOverlayKey,
  parseOverlayKey,
  subscriptionOverlayKey,
} from "../../sync/overlay-keys"
import { catchUpThroughEngine, ensureSyncedThroughEngine } from "../../sync/sync-status"
import type { AcknowledgedChangeKind } from "../../sync/transaction-queue"
import { transactionQueue } from "../../sync/transaction-queue"
import { invalidateEntriesQuery } from "../entry/hooks"
import { getFeedById, getFeedServerId } from "../feed/getter"
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

/** Enough for a delta pull; a slow network does not hold a rename back for longer. */
const CATCH_UP_BEFORE_RENAME_MS = 2000

/** Pull the change log, but give up waiting for it after a moment. */
const catchUpBeforeRename = async () => {
  let timer: ReturnType<typeof setTimeout> | undefined
  await Promise.race([
    catchUpThroughEngine(0),
    new Promise<void>((resolve) => {
      timer = setTimeout(() => resolve(), CATCH_UP_BEFORE_RENAME_MS)
    }),
  ])
  clearTimeout(timer)
}

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
  [FeedViewType.All]: new Set(),
  [FeedViewType.Articles]: new Set(),
  [FeedViewType.Audios]: new Set(),
  [FeedViewType.Notifications]: new Set(),
  [FeedViewType.Pictures]: new Set(),
  [FeedViewType.SocialMedia]: new Set(),
  [FeedViewType.Videos]: new Set(),
}
const emptyCategoryOpenStateByView: Record<FeedViewType, Record<string, boolean>> = {
  [FeedViewType.All]: {},
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

// The All view merges same-named folders across views, so a folder changed there also changes the
// categories of every view its feeds belong to
const getCategoryViews = (
  state: Pick<SubscriptionState, "data">,
  feedIds: string[],
  view: FeedViewType,
) => {
  const views = new Set<FeedViewType>([view])
  for (const feedId of feedIds) {
    const subscription = state.data[feedId]
    if (subscription) views.add(subscription.view)
  }
  return views
}

const invalidateViews = (...views: (FeedViewType | undefined)[]) => {
  const viewSet = new Set<FeedViewType>()

  for (const view of views) {
    if (view === undefined) continue
    viewSet.add(view)
  }

  if (viewSet.size === 0) return

  viewSet.add(FeedViewType.All)

  invalidateEntriesQuery({
    views: Array.from(viewSet),
  })
}
export const useSubscriptionStore = createZustandStore<SubscriptionState>("subscription")(
  () => defaultState,
)

const get = useSubscriptionStore.getState

const immerSet = createImmerSetter(useSubscriptionStore)

// Feeds followed only through an unfollowed list no longer count as unread
const clearUnreadOfFeedsOnlyInLists = (unfollowedLists: SubscriptionModel[]) => {
  if (unfollowedLists.length === 0) return
  const stillFollowed = new Set<string>()
  for (const subscription of Object.values(get().data)) {
    if (subscription.feedId) stillFollowed.add(subscription.feedId)
    if (subscription.listId) {
      for (const feedId of getListById(subscription.listId)?.feedIds ?? []) {
        stillFollowed.add(feedId)
      }
    }
  }
  for (const list of unfollowedLists) {
    if (!list.listId) continue
    for (const feedId of getListById(list.listId)?.feedIds ?? []) {
      if (!stillFollowed.has(feedId)) {
        unreadActions.updateById(feedId, 0)
      }
    }
  }
}

/**
 * Forget a category name no subscription uses any more: in its view once no subscription there
 * has it, and in the All view, which lists every view's folders, once none has it at all.
 * Menus such as "Move to Category" list these names, so a renamed-away one would come back.
 */
const dropUnusedCategory = (
  draft: SubscriptionState,
  category: string | null | undefined,
  view: FeedViewType,
) => {
  if (!category) return
  const subscriptions = Object.values(draft.data)
  if (!subscriptions.some((s) => s.view === view && s.category === category)) {
    draft.categories[view]?.delete(category)
  }
  if (!subscriptions.some((s) => s.category === category)) {
    draft.categories[FeedViewType.All]?.delete(category)
  }
}

const KNOWN_VIEWS = new Set<number>(
  Object.values(FeedViewType).filter((value): value is FeedViewType => typeof value === "number"),
)

/**
 * Whether the store keeps indexes for a view. A subscription in any other one, such as a row a
 * server stored before it checked views, would fail every update of the store and empty the app.
 */
const isKnownView = (view: unknown): view is FeedViewType =>
  typeof view === "number" && KNOWN_VIEWS.has(view)

// Put back subscriptions whose unfollow the server refused
const restoreInSession = (subscriptions: SubscriptionModel[]) => {
  immerSet((draft) => {
    for (const subscription of subscriptions) {
      draft.data[getSubscriptionStoreId(subscription)] = subscription

      draft.subscriptionIdSet.add(getSubscriptionDBId(subscription))
      if (subscription.feedId) {
        draft.feedIdByView[subscription.view]!.add(subscription.feedId)
        draft.feedIdByView[FeedViewType.All]!.add(subscription.feedId)
      }
      if (subscription.listId) {
        draft.listIdByView[subscription.view]!.add(subscription.listId)
        draft.listIdByView[FeedViewType.All]!.add(subscription.listId)
      }
      if (subscription.category) {
        draft.categories[subscription.view]!.add(subscription.category)
        draft.categories[FeedViewType.All]!.add(subscription.category)
      }
    }
  })
}

type EditableSubscriptionField = "view" | "category" | "isPrivate" | "hideFromTimeline" | "title"

/**
 * How each editable field is compared. Forms write "no value" in their own ways: an empty
 * string or `null` for no category or title, `undefined` or `false` for an unset flag.
 */
const editableSubscriptionFields: Record<
  EditableSubscriptionField,
  (value: SubscriptionModel[EditableSubscriptionField]) => unknown
> = {
  view: (value) => value,
  category: (value) => value || null,
  title: (value) => value || null,
  isPrivate: (value) => !!value,
  hideFromTimeline: (value) => !!value,
}

/**
 * The fields an edit really changes. A form fills every field from the local copy, which can
 * be a pull behind an edit made on another device, so sending the fields the user left alone
 * would write their old values back over that edit.
 */
export const getSubscriptionChanges = (current: SubscriptionModel, next: SubscriptionModel) => {
  const changes: Partial<Record<EditableSubscriptionField, unknown>> = {}
  for (const field of Object.keys(editableSubscriptionFields) as EditableSubscriptionField[]) {
    const normalize = editableSubscriptionFields[field]
    if (normalize(next[field]) !== normalize(current[field])) {
      changes[field] = next[field]
    }
  }
  return changes as Partial<Pick<SubscriptionModel, EditableSubscriptionField>>
}

/** A follow or unfollow of a feed or list that the server confirmed to this device. */
export interface ConfirmedSubscriptionChange {
  /** The followed subscription, or null once it was unfollowed */
  subscription: SubscriptionModel | null
  /** The change-log id of the change, when the server named it */
  syncId?: number
}

interface ConfirmedSubscriptionChanges {
  /** Keyed by feed id or list id */
  changes: Array<{ id: string; subscription: SubscriptionModel | null }>
  syncId?: number
}

/**
 * The change log and the subscription list are served from replicas that lag behind the
 * response of a follow or unfollow, so for a moment they still describe the state before it.
 * The confirmed change wins over them until the sync engine has applied its sync id.
 */
const confirmedSubscriptionChangeKind: AcknowledgedChangeKind<ConfirmedSubscriptionChanges> = {
  kind: "subscriptions.confirmed",
  overlays: ({ changes, syncId }) =>
    changes.map(({ id, subscription }) => ({
      key: subscriptionOverlayKey(id),
      value: { subscription, syncId } satisfies ConfirmedSubscriptionChange,
    })),
}

const trackConfirmedChanges = (
  changes: ConfirmedSubscriptionChanges["changes"],
  response: WithLastSyncId,
) => {
  if (changes.length === 0) return
  const syncId = response.lastSyncId
  transactionQueue.trackAcknowledged(confirmedSubscriptionChangeKind, { changes, syncId }, syncId)
}

/** The confirmed follow or unfollow of a feed or list that the change log has not caught up with. */
export const getConfirmedSubscriptionChange = (id: string) =>
  transactionQueue.getOverlays().get(subscriptionOverlayKey(id)) as
    ConfirmedSubscriptionChange | undefined

/** Keep the confirmed follows and unfollows in a subscription list fetched from the server. */
const keepConfirmedChanges = (subscriptions: SubscriptionModel[], view?: FeedViewType) => {
  const changes = new Map<string, ConfirmedSubscriptionChange>()
  for (const [key, value] of transactionQueue.getOverlays()) {
    const id = isSubscriptionOverlayKey(key) ? parseOverlayKey(key)?.id : undefined
    if (id) changes.set(id, value as ConfirmedSubscriptionChange)
  }
  if (changes.size === 0) return subscriptions

  const kept = subscriptions.filter(
    (subscription) => changes.get(getSubscriptionStoreId(subscription))?.subscription !== null,
  )
  const keptIds = new Set(kept.map((subscription) => getSubscriptionStoreId(subscription)))
  for (const [id, { subscription }] of changes) {
    if (!subscription || keptIds.has(id)) continue
    if (typeof view === "number" && subscription.view !== view) continue
    kept.push(subscription)
  }
  return kept
}

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
        if (!isKnownView(subscription.view)) {
          console.warn(
            `[subscription] Skipped ${getSubscriptionStoreId(subscription)} in unknown view ${subscription.view}`,
          )
          continue
        }
        const subscriptionSetId = getSubscriptionDBId(subscription)
        const subscriptionStoreId = getSubscriptionStoreId(subscription)

        draft.data[subscriptionStoreId] = subscription
        draft.subscriptionIdSet.add(subscriptionSetId)

        if (subscription.feedId && subscription.type === "feed") {
          draft.feedIdByView[subscription.view]!.add(subscription.feedId)
          draft.feedIdByView[FeedViewType.All]!.add(subscription.feedId)
          if (subscription.category) {
            draft.categories[subscription.view]!.add(subscription.category)
          }
        }
        if (subscription.listId && subscription.type === "list") {
          draft.listIdByView[subscription.view]!.add(subscription.listId)
          draft.listIdByView[FeedViewType.All]!.add(subscription.listId)
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

  /**
   * Apply a partial update that the server already confirmed, keeping the per-view indexes
   * consistent. Undefined fields in the patch are ignored.
   */
  patchInSession(storeId: string, patch: Partial<SubscriptionModel>) {
    immerSet((draft) => {
      const current = draft.data[storeId]
      if (!current) return

      const definedPatch = Object.fromEntries(
        Object.entries(patch).filter(
          ([key, value]) => value !== undefined && (key !== "view" || isKnownView(value)),
        ),
      ) as Partial<SubscriptionModel>
      const next: SubscriptionModel = { ...current, ...definedPatch }

      if (current.type === "feed" && current.feedId) {
        if (current.view !== next.view) {
          draft.feedIdByView[current.view]?.delete(current.feedId)
          draft.feedIdByView[next.view]?.add(current.feedId)
        }
        if (next.category) {
          draft.categories[next.view]?.add(next.category)
        }
      }

      if (current.type === "list" && current.listId && current.view !== next.view) {
        draft.listIdByView[current.view]?.delete(current.listId)
        draft.listIdByView[next.view]?.add(current.listId)
      }

      draft.data[storeId] = next
      // A rename made on another device arrives as a category change of each of its feeds.
      if (current.category !== next.category || current.view !== next.view) {
        dropUnusedCategory(draft, current.category, current.view)
      }
    })
  }

  /** Drop subscriptions from memory together with their index entries. */
  removeManyInSession(storeIds: string[]) {
    immerSet((draft) => {
      for (const id of storeIds) {
        const subscription = draft.data[id]
        if (!subscription) continue
        draft.subscriptionIdSet.delete(getSubscriptionDBId(subscription))
        if (subscription.feedId) {
          draft.feedIdByView[subscription.view]!.delete(subscription.feedId)
          draft.feedIdByView[FeedViewType.All]!.delete(subscription.feedId)
        }
        if (subscription.listId) {
          draft.listIdByView[subscription.view]!.delete(subscription.listId)
          draft.listIdByView[FeedViewType.All]!.delete(subscription.listId)
        }
        if (subscription.category) {
          draft.categories[subscription.view]!.delete(subscription.category)
          draft.categories[FeedViewType.All]!.delete(subscription.category)
        }
        delete draft.data[id]
      }
    })
  }

  resetByView(view: FeedViewType) {
    immerSet((draft) => {
      // Only this view is refetched, so the other views keep their subscriptions, and the ones
      // the server no longer returns for this view are dropped
      for (const [storeId, subscription] of Object.entries(draft.data)) {
        if (subscription.view !== view) continue
        delete draft.data[storeId]
        draft.subscriptionIdSet.delete(getSubscriptionDBId(subscription))
        if (subscription.feedId) draft.feedIdByView[FeedViewType.All]!.delete(subscription.feedId)
        if (subscription.listId) draft.listIdByView[FeedViewType.All]!.delete(subscription.listId)
      }
      draft.feedIdByView[view] = new Set()
      draft.listIdByView[view] = new Set()
      draft.categories[view] = new Set()
    })
  }

  toggleCategoryOpenState(view: FeedViewType, category: string) {
    immerSet((state) => {
      state.categoryOpenStateByView[view]![category] =
        !state.categoryOpenStateByView[view]![category]
    })
  }

  changeCategoryOpenState(view: FeedViewType, category: string, status: boolean) {
    immerSet((state) => {
      state.categoryOpenStateByView[view]![category] = status
    })
  }

  expandCategoryOpenStateByView(view: FeedViewType, isOpen: boolean) {
    immerSet((state) => {
      for (const category in state.categoryOpenStateByView[view]!) {
        state.categoryOpenStateByView[view]![category] = isOpen
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
    subscriptionActions.upsertMany(keepConfirmedChanges(subscriptions, view), {
      resetBeforeUpsert: typeof view === "number" ? view : true,
    })
    listActions.upsertMany(collections.lists)

    inboxActions.upsertMany(collections.inboxes)

    return {
      subscriptions,
      feeds: collections.feeds,
    }
  }

  /**
   * Bring the subscriptions up to date after a user gesture or a server-side change. The
   * delta feed does it when the sync engine runs; the full list is the fallback.
   *
   * Pass `afterServerChange` when the server just changed subscriptions outside the
   * transaction queue (an import): fresh change-log rows are hidden for about a second.
   */
  async refresh(view?: FeedViewType, options?: { afterServerChange?: boolean }) {
    const synced = options?.afterServerChange
      ? await catchUpThroughEngine()
      : await ensureSyncedThroughEngine()
    if (synced) return
    await this.fetch(view)
  }

  async edit(subscription: SubscriptionModel) {
    const subscriptionId = getSubscriptionStoreId(subscription)
    const current = get().data[subscriptionId]
    if (!current) {
      return
    }
    const changes = getSubscriptionChanges(current, subscription)
    if (Object.keys(changes).length === 0) {
      return
    }
    const next: SubscriptionModel = { ...current, ...changes }
    const tx = createTransaction(current)

    let addNewCategory = false
    tx.store(() => {
      immerSet((draft) => {
        if (next.category && !draft.categories[next.view]!.has(next.category)) {
          addNewCategory = true
          draft.categories[next.view]!.add(next.category)
        }

        if (next.type === "feed") {
          draft.feedIdByView[current.view]!.delete(current.feedId!)
          draft.feedIdByView[next.view]!.add(next.feedId!)
        }
        if (next.type === "list") {
          draft.listIdByView[current.view]!.delete(current.listId!)
          draft.listIdByView[next.view]!.add(next.listId!)
        }

        draft.data[subscriptionId] = next
        if (current.category !== next.category || current.view !== next.view) {
          dropUnusedCategory(draft, current.category, current.view)
        }
      })
    })
    tx.rollback((current) => {
      immerSet((draft) => {
        if (addNewCategory && next.category) {
          draft.categories[next.view]!.delete(next.category)
        }
        if (current.category) {
          draft.categories[current.view]!.add(current.category)
        }

        if (next.type === "feed") {
          draft.feedIdByView[next.view]!.delete(next.feedId!)
          draft.feedIdByView[current.view]!.add(current.feedId!)
        }
        if (next.type === "list") {
          draft.listIdByView[next.view]!.delete(next.listId!)
          draft.listIdByView[current.view]!.add(current.listId!)
        }

        draft.data[subscriptionId] = current
      })
    })
    tx.request(async () => {
      await api().subscriptions.update({
        ...changes,
        feedId: current.feedId ?? undefined,
        listId: current.listId ?? undefined,
      })
    })

    tx.persist(() => {
      return SubscriptionService.patch(storeDbMorph.toSubscriptionSchema(next))
    })

    await tx.run()

    invalidateViews(current.view, next.view)
  }

  async subscribe(subscription: SubscriptionForm) {
    const body: SubscriptionForm = {
      ...subscription,
      // A feed the server has not stored yet is followed by its URL, not by its nonce id
      feedId: getFeedServerId(subscription.feedId),
    }
    const data = await api().subscriptions.create(body)
    // The server can answer without following anything, as when two accounts follow the same
    // new feed at once; a retry follows it
    if (!data.feed && !data.list) {
      throw new Error(t("feed.follow_failed", { ns: "common" }))
    }

    if (data.feed) {
      feedActions.upsertMany([data.feed as any])
      tracker.subscribe({ feedId: data.feed.id, view: subscription.view })
    }

    if (data.list) {
      listActions.upsertMany([
        {
          ...(data.list as any),
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
    const followed: SubscriptionModel = {
      ...subscription,
      title: subscription.title ?? null,
      category: subscription.category ?? null,

      type: data.list ? "list" : "feed",
      createdAt: new Date().toISOString(),
      feedId: data.feed?.id ?? null,
      listId: data.list?.id ?? null,
      inboxId: null,
      userId: whoami()?.id ?? "",
    }
    if (followed.feedId || followed.listId) {
      trackConfirmedChanges(
        [{ id: getSubscriptionStoreId(followed), subscription: followed }],
        data,
      )
    }
    await subscriptionActions.upsertMany([followed])

    invalidateViews(subscription.view)
  }

  async unsubscribe(id: string | undefined | null | (string | undefined | null)[]) {
    const normalizedIds = (Array.isArray(id) ? id : [id]).filter((i) => typeof i === "string")
    const subscriptionList = normalizedIds.map((id) => get().data[id]).filter((i) => !!i)
    const feedsAndLists = normalizedIds
      .map((id) => getFeedById(id) ?? getListById(id))
      .filter((i) => !!i)
    if (subscriptionList.length === 0) return feedsAndLists

    subscriptionActions.removeManyInSession(normalizedIds)

    // One request unfollows the feeds and the lists together, or nothing of them
    const feedSubscriptions = subscriptionList.filter((i) => i.type === "feed" && !!i.feedId)
    const listSubscriptions = subscriptionList.filter((i) => i.type === "list" && !!i.listId)
    const requested = [...feedSubscriptions, ...listSubscriptions]
    let requestError: unknown
    let failed = false
    if (requested.length > 0) {
      try {
        const response = await api().subscriptions.delete({
          ...(feedSubscriptions.length > 0 && {
            feedIdList: feedSubscriptions.map((s) => s.feedId!),
          }),
          ...(listSubscriptions.length > 0 && {
            listIdList: listSubscriptions.map((s) => s.listId!),
          }),
        })
        trackConfirmedChanges(
          requested.map((subscription) => ({
            id: getSubscriptionStoreId(subscription),
            subscription: null,
          })),
          response,
        )
      } catch (error) {
        restoreInSession(requested)
        requestError = error
        failed = true
      }
    }
    const unfollowed = failed
      ? subscriptionList.filter((subscription) => !requested.includes(subscription))
      : subscriptionList

    if (unfollowed.length > 0) {
      await SubscriptionService.delete(unfollowed.map((i) => buildSubscriptionDbId(i)))
      invalidateViews(...unfollowed.map((i) => i.view))

      for (const subscription of unfollowed) {
        if (subscription.type === "feed") unreadActions.updateById(subscription.feedId, 0)
      }
      clearUnreadOfFeedsOnlyInLists(unfollowed.filter((i) => i.type === "list"))
    }

    if (failed) throw requestError
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
          draft.feedIdByView[currentView]!.delete(feedId)
          draft.feedIdByView[newView]!.add(feedId)
          subscription.view = newView

          // `null` takes the feeds out of their category, `undefined` leaves it as it is
          if (newCategory !== undefined) {
            if (newCategory) {
              draft.categories[newView]!.add(newCategory)
            }
            subscription.category = newCategory
          }
        }

        // Drop the categories the moved feeds left empty
        for (const previous of current) {
          if (!previous?.category) continue
          const { category, view } = previous
          const isStillUsed = Object.values(draft.data).some(
            (subscription) => subscription.view === view && subscription.category === category,
          )
          if (!isStillUsed) {
            draft.categories[view]!.delete(category)
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
          draft.feedIdByView[newView]!.delete(feedId)
          draft.feedIdByView[current[index]!.view]!.add(feedId)

          if (newCategory !== undefined) {
            subscription.category = current[index].category
          }
          const previousCategory = current[index].category
          if (previousCategory) {
            draft.categories[current[index].view]!.add(previousCategory)
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

        draft.data[listId]!.view = newView
        draft.listIdByView[currentView]!.delete(listId)
        draft.listIdByView[newView]!.add(listId)
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

        draft.data[listId]!.view = current.view
        draft.listIdByView[newView]!.delete(listId)
        draft.listIdByView[currentView]!.add(listId)
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
    const categoryViews = getCategoryViews(get(), feedIds, view)

    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        for (const feedId of feedIds) {
          const subscription = draft.data[feedId]
          if (!subscription) continue
          subscription.category = null
        }
        for (const categoryView of categoryViews) {
          draft.categories[categoryView]!.delete(category)
        }
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

        for (const categoryView of categoryViews) {
          draft.categories[categoryView]!.add(category)
        }
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

    invalidateViews(currentView, newView)
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
    // Updated once the change log was pulled, below.
    const feedIds = [...getCategoryFeedIds(lastCategory, view)]
    const categoryViews = getCategoryViews(get(), feedIds, view)
    // A folder the feeds are filed under by name is renamed by name. An auto-grouped folder also
    // holds feeds by their site, which have no category on the server, so those are named.
    const isFiledByName = (ids: string[]) =>
      ids.every((id) => get().data[id]?.category === lastCategory)
    let renameByName = isFiledByName(feedIds)

    const renameInSession = (ids: string[], views: Iterable<FeedViewType>) => {
      immerSet((draft) => {
        for (const id of ids) {
          const subscription = draft.data[id]
          if (!subscription) continue
          subscription.category = newCategory
        }
        for (const categoryView of views) {
          draft.categories[categoryView]!.add(newCategory)
          draft.categories[categoryView]!.delete(lastCategory)
        }
      })
    }

    const tx = createTransaction()
    tx.store(() => {
      renameInSession(feedIds, categoryViews)
      immerSet((draft) => {
        const lastCategoryOpenState = draft.categoryOpenStateByView[view]![lastCategory]
        if (typeof lastCategoryOpenState === "boolean") {
          draft.categoryOpenStateByView[view]![newCategory] = lastCategoryOpenState
          delete draft.categoryOpenStateByView[view]![lastCategory]
        }
      })
    })

    tx.request(async () => {
      // Another device may have moved a feed into the category since the last pull, or out of
      // it. Pull first, so this device shows the feeds that are in the category now. A rename
      // by name also takes the feeds moved in after the pull; one by the feeds names only
      // those, and a feed moved in later would keep the old name and split the category.
      await catchUpBeforeRename()
      const { data } = get()
      const stillNamedBefore = getCategoryFeedIds(lastCategory, view)
      renameByName &&= isFiledByName(stillNamedBefore)
      const renamed = feedIds.filter((id) => data[id]?.category === newCategory)
      feedIds.splice(0, feedIds.length, ...new Set([...renamed, ...stillNamedBefore]))
      if (stillNamedBefore.length > 0) {
        const views = getCategoryViews(get(), stillNamedBefore, view)
        for (const categoryView of views) categoryViews.add(categoryView)
        renameInSession(stillNamedBefore, views)
      }

      await api().categories.update(
        renameByName
          ? { from: lastCategory, to: newCategory, view }
          : { feedIdList: feedIds, category: newCategory },
      )
    })

    tx.rollback(() => {
      immerSet((draft) => {
        for (const id of feedIds) {
          const subscription = draft.data[id]
          if (!subscription) continue
          const defaultCategory = getDefaultCategory(subscription)
          subscription.category = lastCategory !== defaultCategory ? lastCategory : null
        }
        for (const categoryView of categoryViews) {
          draft.categories[categoryView]!.delete(newCategory)
          draft.categories[categoryView]!.add(lastCategory)
        }

        const lastCategoryOpenState = draft.categoryOpenStateByView[view]![newCategory]
        if (typeof lastCategoryOpenState === "boolean") {
          draft.categoryOpenStateByView[view]![lastCategory] = lastCategoryOpenState
          delete draft.categoryOpenStateByView[view]![newCategory]
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
