import { FeedViewType } from "@follow/constants"
import { EntryService } from "@follow/database/services/entry"
import { InboxService } from "@follow/database/services/inbox"
import { ListService } from "@follow/database/services/list"
import { SubscriptionService } from "@follow/database/services/subscription"
import { SyncMetaService } from "@follow/database/services/sync-meta"
import { FollowAPIError } from "@follow-app/client-sdk"

import { syncApi } from "../context"
import type { Resetable } from "../lib/base"
import { collectionActions } from "../modules/collection/store"
import { invalidateEntriesQuery, refreshEntriesHead } from "../modules/entry/hooks"
import { entryActions } from "../modules/entry/store"
import { setFeedUnreadDirty } from "../modules/feed/hooks"
import { feedActions } from "../modules/feed/store"
import { inboxActions, useInboxStore } from "../modules/inbox/store"
import { getListById } from "../modules/list/getters"
import { listActions } from "../modules/list/store"
import { getSubscriptionById } from "../modules/subscription/getter"
import { subscriptionActions, subscriptionSyncService } from "../modules/subscription/store"
import type { SubscriptionModel } from "../modules/subscription/types"
import {
  getInboxStoreId,
  getSubscriptionDBId,
  getSubscriptionStoreId,
} from "../modules/subscription/utils"
import { unreadActions, unreadSyncService } from "../modules/unread/store"
import { whoami } from "../modules/user/getters"
import { apiMorph } from "../morph/api"
import { getSyncModelHandler, getSyncModelHandlers } from "./model-registry"
import { entryReadOverlayKey } from "./overlay-keys"
import { registerSyncEngine, setSyncEngineActive } from "./sync-status"
import { isNavigatorOnline, transactionQueue } from "./transaction-queue"
import type {
  CollectionActionData,
  InboxEntryActionData,
  ListActionData,
  SyncAction,
  TimelineNewEntriesActionData,
  TimelineReadActionData,
} from "./types"

/**
 * Incremental synchronization of user-owned models, modelled on Linear's sync engine.
 *
 * The client keeps `lastSyncId`, the highest change-log id it applied. A bootstrap takes
 * the current id from the server and then loads full snapshots; every later pull asks for
 * the actions recorded after the cursor and applies them to the stores. Pending local
 * transactions keep precedence through the transaction queue's overlays.
 *
 * Once a cursor exists the snapshots are not needed for freshness any more: the local
 * database plus the delta feed is the state. Snapshots are only taken again as a rare
 * calibration, for the things the change log cannot express: unread entries ageing out of
 * the retention window, and feed metadata, which is not owned by the user.
 */

const LAST_SYNC_ID_KEY = "lastSyncId"
const UNREAD_CALIBRATED_AT_KEY = "unreadCalibratedAt"
/** The sync id the last unread snapshot reflects; counters logged up to it are not applied again. */
const UNREAD_SNAPSHOT_SYNC_ID_KEY = "unreadSnapshotSyncId"
const SUBSCRIPTIONS_CALIBRATED_AT_KEY = "subscriptionsCalibratedAt"
/** Set once a registered model was loaded in full, so later launches rely on the change log. */
const modelBootstrappedKey = (model: string) => `bootstrapped:${model}`
const PULL_INTERVAL_MS = 60_000
const UNREAD_CALIBRATION_INTERVAL_MS = 60 * 60_000
const SUBSCRIPTIONS_CALIBRATION_INTERVAL_MS = 24 * 60 * 60_000
/** A recount asked for by the UI is not repeated more often than this. */
const REQUESTED_CALIBRATION_MIN_INTERVAL_MS = 60_000
/** `ensureSynced` callers arriving within this window share the previous pull. */
const FRESH_PULL_WINDOW_MS = 5000
/** The server hides actions younger than one second; wait a bit longer after an ack. */
const ACK_PULL_DELAY_MS = 1500
const MAX_PAGES_PER_PULL = 20

export type SyncPullReason = "launch" | "resume" | "interval" | "ack" | "manual"

type SubscriptionSyncPayload = Parameters<typeof apiMorph.toSubscription>[0][number]

interface PullSummary {
  /** An action changed unread counters in a way only a recount can resolve. */
  refreshUnread: boolean
  /** Views whose timelines changed structurally: a subscription or list membership moved. */
  invalidateViews: Set<FeedViewType>
  /** Views that received new entries; only the head of their lists needs fetching. */
  newEntryViews: Set<FeedViewType>
  /** When the newest of those entries was logged, to skip lists fetched after it. */
  newestEntryAt: number
}

const createPullSummary = (): PullSummary => ({
  refreshUnread: false,
  invalidateViews: new Set(),
  newEntryViews: new Set(),
  newestEntryAt: 0,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const addView = (views: Set<FeedViewType>, view: FeedViewType | undefined) => {
  if (typeof view !== "number") return
  views.add(view)
  views.add(FeedViewType.All)
}

const isCountRecord = (value: unknown): value is Record<string, number> =>
  isRecord(value) && Object.values(value).every((count) => typeof count === "number")

class SyncEngine implements Resetable {
  private lastSyncId: number | null = null
  private loaded = false
  private unavailable = false
  private unreadCalibratedAt = 0
  private unreadSnapshotSyncId = 0
  private subscriptionsCalibratedAt = 0
  private lastPullFinishedAt = 0
  /** Models whose actions were skipped this session because nobody handled them yet. */
  private unhandledModels = new Set<string>()
  /**
   * Views that received new entries while the user was reading. Their lists are left alone
   * until the next return to the app, which is when they are brought up to date.
   */
  private pendingNewEntryViews = new Set<FeedViewType>()
  private pendingNewestEntryAt = 0
  private pulling: Promise<void> | null = null
  private pullTimer: ReturnType<typeof setTimeout> | null = null
  private intervalTimer: ReturnType<typeof setInterval> | null = null
  private listenersAttached = false
  private detachQueueListener: (() => void) | null = null

  getLastSyncId() {
    return this.lastSyncId
  }

  /** False once the server answered 404 for the sync endpoints; the app then keeps its full refetch behaviour. */
  isAvailable() {
    return !this.unavailable
  }

  /** Load the cursor, attach the triggers and run the first pull. Call once after hydration. */
  async start() {
    await this.loadCursor()
    this.attachListeners()
    this.schedulePull("launch")
  }

  private async loadCursor() {
    if (this.loaded) return
    try {
      const [stored, unreadCalibratedAt, unreadSnapshotSyncId, subscriptionsCalibratedAt] =
        await Promise.all([
          SyncMetaService.get(LAST_SYNC_ID_KEY),
          SyncMetaService.get(UNREAD_CALIBRATED_AT_KEY),
          SyncMetaService.get(UNREAD_SNAPSHOT_SYNC_ID_KEY),
          SyncMetaService.get(SUBSCRIPTIONS_CALIBRATED_AT_KEY),
        ])
      const parsed = stored === null ? Number.NaN : Number(stored)
      this.lastSyncId = Number.isFinite(parsed) ? parsed : null
      this.unreadCalibratedAt = Number(unreadCalibratedAt) || 0
      this.unreadSnapshotSyncId = Number(unreadSnapshotSyncId) || 0
      this.subscriptionsCalibratedAt = Number(subscriptionsCalibratedAt) || 0
      setSyncEngineActive(this.lastSyncId !== null)
    } catch (error) {
      console.error("[sync-engine] failed to load the sync cursor", error)
    }
    this.loaded = true
  }

  /** The network or the app came back: pull as soon as possible. */
  resume() {
    // Coming back fires more than one event (focus, visibility); one pull covers them.
    if (this.pulling || Date.now() - this.lastPullFinishedAt < FRESH_PULL_WINDOW_MS) return
    this.schedulePull("resume")
  }

  schedulePull(reason: SyncPullReason, delayMs = 0) {
    if (this.pullTimer) {
      clearTimeout(this.pullTimer)
    }
    this.pullTimer = setTimeout(() => {
      this.pullTimer = null
      void this.pull(reason)
    }, delayMs)
  }

  pull(reason: SyncPullReason = "manual"): Promise<void> {
    if (this.pulling) return this.pulling
    this.pulling = this.runPull(reason)
      .catch((error) => {
        console.error("[sync-engine] pull failed", error)
      })
      .finally(() => {
        this.pulling = null
        this.lastPullFinishedAt = Date.now()
      })
    return this.pulling
  }

  /**
   * Bring the stores up to date through the engine and say whether that was possible.
   *
   * `true` means the local stores are the state: either the delta feed was applied on top of
   * the local snapshot, or a bootstrap just loaded everything. Callers must not fetch their
   * own snapshot then. `false` means the engine cannot help (logged out, or the server has no
   * sync endpoints) and the caller has to fall back to its full request.
   *
   * A pull that fails with a cursor in place still answers `true`: the local snapshot is the
   * best state there is, and the next trigger retries.
   */
  async ensureSynced(): Promise<boolean> {
    if (this.unavailable || !whoami()) return false
    if (this.pulling || Date.now() - this.lastPullFinishedAt > FRESH_PULL_WINDOW_MS) {
      await this.pull("manual")
    }
    return !this.unavailable && this.lastSyncId !== null
  }

  /**
   * Pick up a change the server made outside the transaction queue, for instance an import.
   * The delay covers the second during which the server hides fresh actions.
   */
  async catchUp(delayMs = ACK_PULL_DELAY_MS): Promise<boolean> {
    if (this.unavailable || this.lastSyncId === null) return false
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    await this.pull("manual")
    return !this.unavailable && this.lastSyncId !== null
  }

  /**
   * The UI noticed counters that cannot be right. Recount, but not more often than once a
   * minute: the usual cause is a list that is simply ahead of the next pull.
   */
  async requestUnreadCalibration() {
    if (Date.now() - this.unreadCalibratedAt < REQUESTED_CALIBRATION_MIN_INTERVAL_MS) return
    await this.calibrateUnread()
  }

  /** Take the server's current id, then load full snapshots. Later pulls are incremental. */
  async bootstrap() {
    let lastSyncId: number
    try {
      const response = await syncApi().state()
      lastSyncId = response.data.lastSyncId
    } catch (error) {
      if (this.markUnavailableIfMissing(error)) return
      throw error
    }

    await subscriptionSyncService.fetch()
    await this.markCalibrated(SUBSCRIPTIONS_CALIBRATED_AT_KEY)
    // The snapshot reflects at least the id read above; the response may name a later one.
    await unreadSyncService.resetFromRemote({ fallbackSyncId: lastSyncId })
    await this.markCalibrated(UNREAD_CALIBRATED_AT_KEY)
    await this.bootstrapRegisteredModels({ force: true })
    await this.setLastSyncId(lastSyncId)
  }

  /**
   * Load registered models that were never loaded in full on this account. With `force`
   * every model is loaded again, because the engine lost its place in the change log.
   */
  private async bootstrapRegisteredModels({ force = false }: { force?: boolean } = {}) {
    await Promise.all(
      Array.from(getSyncModelHandlers(), async ([model, handler]) => {
        if (!handler.bootstrap) return
        const key = modelBootstrappedKey(model)
        try {
          if (!force && (await SyncMetaService.get(key)) !== null) return
          await handler.bootstrap()
          await SyncMetaService.set(key, "1")
          this.unhandledModels.delete(model)
        } catch (error) {
          // The flag stays unset, so the next pull tries again.
          console.error(`[sync-engine] failed to bootstrap ${model}`, error)
        }
      }),
    )
  }

  private async calibrateUnread() {
    // Claim the slot first so concurrent triggers do not recount twice.
    await this.markCalibrated(UNREAD_CALIBRATED_AT_KEY)
    await this.takeUnreadSnapshot().catch((error) => {
      console.error("[sync-engine] failed to recount unread entries", error)
    })
  }

  /**
   * Recount through `/reads`. The snapshot is paired with the sync id it reflects, so the
   * counters of actions logged before it are not added on top when the log delivers them
   * later. That happens whenever the snapshot runs ahead of the pull that carries those
   * actions: a poll answered from a stale head, or new-entry hints logged seconds earlier.
   *
   * A server that does not name the id in its answer gets the state read just before: every
   * action visible then has its change inside a snapshot taken afterwards.
   */
  private async takeUnreadSnapshot() {
    const fallbackSyncId = await syncApi()
      .state()
      .then((response) => response.data.lastSyncId)
      .catch(() => undefined)
    await unreadSyncService.resetFromRemote({ fallbackSyncId })
  }

  /** Remember how far the log was reflected by the last unread snapshot. */
  async recordUnreadSnapshot(lastSyncId: number) {
    if (!Number.isFinite(lastSyncId) || lastSyncId <= this.unreadSnapshotSyncId) return
    this.unreadSnapshotSyncId = lastSyncId
    await SyncMetaService.set(UNREAD_SNAPSHOT_SYNC_ID_KEY, String(lastSyncId)).catch((error) => {
      console.error("[sync-engine] failed to persist the unread snapshot id", error)
    })
  }

  private async calibrateSubscriptions() {
    await this.markCalibrated(SUBSCRIPTIONS_CALIBRATED_AT_KEY)
    await subscriptionSyncService.fetch().catch((error) => {
      console.error("[sync-engine] failed to refresh subscriptions", error)
    })
  }

  private async markCalibrated(
    key: typeof UNREAD_CALIBRATED_AT_KEY | typeof SUBSCRIPTIONS_CALIBRATED_AT_KEY,
  ) {
    const now = Date.now()
    if (key === UNREAD_CALIBRATED_AT_KEY) {
      this.unreadCalibratedAt = now
    } else {
      this.subscriptionsCalibratedAt = now
    }
    await SyncMetaService.set(key, String(now)).catch((error) => {
      console.error("[sync-engine] failed to persist the calibration time", error)
    })
  }

  /** Forget the cursor. Used on logout; the next start bootstraps again. */
  async reset() {
    this.clearInSession()
    // Every key in the table belongs to the engine: the cursor, calibration times, and the
    // bootstrap flags and documents of registered models.
    await SyncMetaService.reset().catch((error) => {
      console.error("[sync-engine] failed to clear the sync cursor", error)
    })
  }

  clearInSession() {
    if (this.pullTimer) {
      clearTimeout(this.pullTimer)
      this.pullTimer = null
    }
    this.lastSyncId = null
    this.loaded = false
    this.unavailable = false
    this.unreadCalibratedAt = 0
    this.unreadSnapshotSyncId = 0
    this.subscriptionsCalibratedAt = 0
    this.lastPullFinishedAt = 0
    this.unhandledModels.clear()
    this.pendingNewEntryViews.clear()
    this.pendingNewestEntryAt = 0
    setSyncEngineActive(false)
  }

  private async runPull(reason: SyncPullReason) {
    if (this.unavailable || !whoami() || !isNavigatorOnline()) return
    await this.loadCursor()

    if (this.lastSyncId === null) {
      await this.bootstrap()
      return
    }

    const summary = createPullSummary()
    let cursor = this.lastSyncId

    for (let page = 0; page < MAX_PAGES_PER_PULL; page++) {
      let response: Awaited<ReturnType<ReturnType<typeof syncApi>["delta"]>>
      try {
        response = await syncApi().delta({ lastSyncId: cursor })
      } catch (error) {
        if (this.markUnavailableIfMissing(error)) return
        throw error
      }

      const { data } = response
      if (data.reset) {
        await this.bootstrap()
        return
      }

      if (data.actions.length > 0) {
        await this.applyActions(data.actions, summary)
      }

      if (data.lastSyncId > cursor) {
        cursor = data.lastSyncId
        await this.setLastSyncId(cursor)
      }

      if (!data.hasMore) break
    }

    // After the delta, so a snapshot taken now is never overwritten by an older action.
    await this.bootstrapRegisteredModels()
    await this.finishPull(summary, reason)
  }

  private async finishPull(summary: PullSummary, reason: SyncPullReason) {
    const now = Date.now()
    if (summary.refreshUnread || now - this.unreadCalibratedAt > UNREAD_CALIBRATION_INTERVAL_MS) {
      await this.calibrateUnread()
    }
    if (now - this.subscriptionsCalibratedAt > SUBSCRIPTIONS_CALIBRATION_INTERVAL_MS) {
      await this.calibrateSubscriptions()
    }

    if (summary.invalidateViews.size > 0) {
      invalidateEntriesQuery({ views: Array.from(summary.invalidateViews) })
      for (const view of summary.invalidateViews) {
        this.pendingNewEntryViews.delete(view)
      }
    }

    // New entries never rearrange what is already loaded, so only the edge of the lists on
    // screen is fetched. While the user is reading, the lists are left alone and the views
    // are remembered for the next return to the app.
    for (const view of summary.newEntryViews) {
      if (!summary.invalidateViews.has(view)) this.pendingNewEntryViews.add(view)
    }
    this.pendingNewestEntryAt = Math.max(this.pendingNewestEntryAt, summary.newestEntryAt)
    if (reason === "interval" || reason === "ack") return

    const views = Array.from(this.pendingNewEntryViews)
    const since = this.pendingNewestEntryAt
    this.pendingNewEntryViews.clear()
    this.pendingNewestEntryAt = 0
    if (views.length > 0) {
      await refreshEntriesHead({ views, since }).catch((error) => {
        console.error("[sync-engine] failed to fetch new entries", error)
      })
    }
  }

  private async applyActions(actions: SyncAction[], summary: PullSummary) {
    for (const action of actions) {
      try {
        await this.applyAction(action, summary)
      } catch (error) {
        console.error(`[sync-engine] failed to apply ${action.model}/${action.action}`, error)
      }
    }
  }

  private async applyAction(action: SyncAction, summary: PullSummary) {
    switch (action.model) {
      case "subscription":
      case "list_subscription": {
        await this.applySubscriptionAction(action, summary)
        return
      }
      case "collection": {
        await this.applyCollectionAction(action)
        return
      }
      case "timeline": {
        await this.applyTimelineAction(action, summary)
        return
      }
      case "list": {
        await this.applyListAction(action, summary)
        return
      }
      case "inbox": {
        await this.applyInboxAction(action, summary)
        return
      }
      case "inbox_entry": {
        await this.applyInboxEntryAction(action, summary)
        return
      }
      default: {
        await this.applyRegisteredModelAction(action)
      }
    }
  }

  private async applyRegisteredModelAction(action: SyncAction) {
    const handler = getSyncModelHandler(action.model)
    if (handler) {
      await handler.apply(action)
      return
    }

    // Nobody handles this model (yet). Forget that it was bootstrapped, so a handler that
    // registers later loads it in full instead of trusting a change log it never saw.
    if (this.unhandledModels.has(action.model)) return
    this.unhandledModels.add(action.model)
    await SyncMetaService.delete(modelBootstrappedKey(action.model)).catch(() => {})
  }

  private async applySubscriptionAction(action: SyncAction, summary: PullSummary) {
    if (!action.modelId) return

    if (action.action === "I") {
      if (!isRecord(action.data) || !("feeds" in action.data || "lists" in action.data)) return
      const { subscriptions, collections } = apiMorph.toSubscription([
        action.data as unknown as SubscriptionSyncPayload,
      ])
      await feedActions.upsertMany(collections.feeds)
      await listActions.upsertMany(collections.lists)
      await subscriptionActions.upsertMany(subscriptions)
      for (const subscription of subscriptions) {
        addView(summary.invalidateViews, subscription.view)
      }
      summary.refreshUnread = true
      return
    }

    const current = getSubscriptionById(action.modelId)
    if (!current) return

    if (action.action === "U") {
      if (!isRecord(action.data)) return
      const patch = action.data as Partial<SubscriptionModel>
      const previousView = current.view
      subscriptionActions.patchInSession(getSubscriptionStoreId(current), patch)
      const next = getSubscriptionById(action.modelId)
      if (next) {
        await SubscriptionService.patch({
          id: getSubscriptionDBId(next),
          ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
        })
        if (next.view !== previousView) {
          addView(summary.invalidateViews, previousView)
          addView(summary.invalidateViews, next.view)
        }
      }
      return
    }

    if (action.action === "D") {
      subscriptionActions.removeManyInSession([getSubscriptionStoreId(current)])
      await SubscriptionService.delete([getSubscriptionDBId(current)])
      if (current.feedId) {
        await unreadActions.updateById(current.feedId, 0)
      }
      addView(summary.invalidateViews, current.view)
    }
  }

  private async applyCollectionAction(action: SyncAction) {
    if (!action.modelId) return

    if (action.action === "I") {
      if (!isRecord(action.data)) return
      const data = action.data as unknown as CollectionActionData
      await collectionActions.upsertMany([
        {
          entryId: data.entryId ?? action.modelId,
          feedId: data.feedId,
          view: data.view as FeedViewType,
          createdAt: data.createdAt,
        },
      ])
      return
    }

    if (action.action === "D") {
      await collectionActions.delete(action.modelId)
    }
  }

  private async applyTimelineAction(action: SyncAction, summary: PullSummary) {
    // The last snapshot already counted everything logged up to its id.
    const countersInSnapshot = action.id <= this.unreadSnapshotSyncId

    if (action.action === "U") {
      if (!isRecord(action.data) || !Array.isArray(action.data.entryIds)) return
      const data = action.data as unknown as TimelineReadActionData
      // A pending local transaction on the same entry wins over the remote change.
      const overlays = transactionQueue.getOverlays()
      const entryIds = data.entryIds.filter((entryId) => {
        const override = overlays.get(entryReadOverlayKey(entryId))
        return typeof override !== "boolean" || override === data.read
      })
      if (entryIds.length > 0) {
        entryActions.markEntryReadStatusInSession({ entryIds, read: data.read })
        await EntryService.patchMany({ entry: { read: data.read }, entryIds })
      }

      if (countersInSnapshot) return

      // The counters follow the server even when a local transaction keeps an entry's read
      // state: that transaction is rebased on top of the confirmed counts.
      if (isCountRecord(data.feeds)) {
        const sign = data.read ? -1 : 1
        await unreadActions.applyConfirmedDelta(
          Object.fromEntries(Object.entries(data.feeds).map(([id, count]) => [id, sign * count])),
        )
      } else {
        summary.refreshUnread = true
      }
      return
    }

    if (action.action === "N") {
      if (!isRecord(action.data)) return
      const data = action.data as unknown as TimelineNewEntriesActionData
      const id = data.isInbox ? (data.inboxId ?? action.modelId) : (data.feedId ?? action.modelId)
      if (!id) return

      setFeedUnreadDirty(id)
      if (data.isInbox) {
        addView(summary.newEntryViews, FeedViewType.Articles)
      } else {
        addView(summary.newEntryViews, getSubscriptionById(id)?.view)
        for (const source of data.from ?? []) {
          if (source === "feed") continue
          addView(summary.newEntryViews, getSubscriptionById(source)?.view)
        }
      }
      const loggedAt = Date.parse(action.createdAt)
      if (Number.isFinite(loggedAt)) {
        summary.newestEntryAt = Math.max(summary.newestEntryAt, loggedAt)
      }

      if (countersInSnapshot) return
      if (typeof data.unread === "number") {
        await unreadActions.applyConfirmedDelta({ [id]: data.unread })
      } else {
        summary.refreshUnread = true
      }
    }
  }

  private async applyListAction(action: SyncAction, summary: PullSummary) {
    const listId = action.modelId
    if (!listId) return

    if (action.action === "U") {
      if (!isRecord(action.data)) return
      const current = getListById(listId)
      if (!current) return

      const patch = Object.fromEntries(
        Object.entries(action.data as ListActionData).filter(([, value]) => value !== undefined),
      ) as Partial<typeof current>
      await listActions.upsertMany([{ ...current, ...patch }])

      if ("feedIds" in patch) {
        // Membership changed: the list's timeline and unread counts are different now.
        addView(summary.invalidateViews, current.view)
        summary.refreshUnread = true
      }
      return
    }

    if (action.action === "D") {
      const subscription = getSubscriptionById(listId)
      if (subscription?.listId) {
        subscriptionActions.removeManyInSession([getSubscriptionStoreId(subscription)])
        await SubscriptionService.delete([getSubscriptionDBId(subscription)])
        addView(summary.invalidateViews, subscription.view)
      }
      listActions.removeInSession(listId)
      await ListService.deleteList(listId)
    }
  }

  private async applyInboxAction(action: SyncAction, summary: PullSummary) {
    const inboxId = action.modelId
    if (!inboxId) return

    if (action.action === "I") {
      if (!isRecord(action.data) || !("inboxes" in action.data)) return
      const { subscriptions, collections } = apiMorph.toSubscription([
        action.data as unknown as SubscriptionSyncPayload,
      ])
      await inboxActions.upsertMany(collections.inboxes)
      await subscriptionActions.upsertMany(subscriptions)
      return
    }

    if (action.action === "U") {
      if (!isRecord(action.data)) return
      const current = useInboxStore.getState().inboxes[inboxId]
      if (!current) return
      const title = typeof action.data.title === "string" ? action.data.title : null
      await inboxActions.upsertMany([{ id: current.id, secret: current.secret, title }])

      const subscription = getSubscriptionById(getInboxStoreId(inboxId))
      if (subscription) {
        subscriptionActions.patchInSession(getSubscriptionStoreId(subscription), { title })
        await SubscriptionService.patch({ id: getSubscriptionDBId(subscription), title })
      }
      return
    }

    if (action.action === "D") {
      const subscription = getSubscriptionById(getInboxStoreId(inboxId))
      if (subscription) {
        subscriptionActions.removeManyInSession([getSubscriptionStoreId(subscription)])
        await SubscriptionService.delete([getSubscriptionDBId(subscription)])
      }
      inboxActions.deleteById(inboxId)
      await InboxService.deleteById(inboxId)
      await unreadActions.updateById(inboxId, 0)
      addView(summary.invalidateViews, FeedViewType.Articles)
    }
  }

  private async applyInboxEntryAction(action: SyncAction, summary: PullSummary) {
    if (action.action !== "D" || !action.modelId) return

    const data = isRecord(action.data) ? (action.data as InboxEntryActionData) : {}
    entryActions.deleteInboxEntryById(action.modelId)
    await EntryService.deleteMany([action.modelId])
    if (data.inboxId) {
      setFeedUnreadDirty(data.inboxId)
    }
    if (action.id <= this.unreadSnapshotSyncId) return
    if (typeof data.unread !== "boolean" || !data.inboxId) {
      summary.refreshUnread = true
    } else if (data.unread) {
      await unreadActions.applyConfirmedDelta({ [data.inboxId]: -1 })
    }
  }

  private async setLastSyncId(lastSyncId: number) {
    this.lastSyncId = lastSyncId
    setSyncEngineActive(true)
    // Everything up to this id is reflected in what the server returns from now on.
    transactionQueue.markSynced(lastSyncId)
    try {
      await SyncMetaService.set(LAST_SYNC_ID_KEY, String(lastSyncId))
    } catch (error) {
      console.error("[sync-engine] failed to persist the sync cursor", error)
    }
  }

  private markUnavailableIfMissing(error: unknown) {
    if (error instanceof FollowAPIError && error.status === 404) {
      this.unavailable = true
      setSyncEngineActive(false)
      console.info("[sync-engine] the server has no sync endpoints; keeping full refetch behaviour")
      return true
    }
    return false
  }

  private attachListeners() {
    if (this.listenersAttached) return
    this.listenersAttached = true

    this.detachQueueListener = transactionQueue.onAcknowledged(() => {
      this.schedulePull("ack", ACK_PULL_DELAY_MS)
    })

    this.intervalTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      void this.pull("interval")
    }, PULL_INTERVAL_MS)

    if (typeof globalThis.addEventListener === "function") {
      globalThis.addEventListener("online", () => this.resume())
      // Switching back to a desktop window does not change the document's visibility, so
      // the window's own focus is the return signal there.
      globalThis.addEventListener("focus", () => this.resume())
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.resume()
      })
    }
  }
}

export const syncEngine = new SyncEngine()
registerSyncEngine(syncEngine)
