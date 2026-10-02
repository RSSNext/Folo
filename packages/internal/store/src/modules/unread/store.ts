import { FeedViewType } from "@follow/constants"
import type { UnreadSchema } from "@follow/database/schemas/types"
import { EntryService } from "@follow/database/services/entry"
import { UnreadService } from "@follow/database/services/unread"
import type { MarkAllAsReadRequest } from "@follow-app/client-sdk"
import { isEqual } from "es-toolkit"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createTransaction, createZustandStore } from "../../lib/helper"
import { entryReadOverlayKey } from "../../sync/overlay-keys"
import {
  ensureSyncedThroughEngine,
  recordUnreadSnapshotThroughEngine,
  requestUnreadCalibration,
} from "../../sync/sync-status"
import {
  defineTransactionKind,
  readLastSyncId,
  transactionQueue,
} from "../../sync/transaction-queue"
import { getEntry } from "../entry/getter"
import { entryActions } from "../entry/store"
import { setFeedUnreadDirty } from "../feed/hooks"
import { getListFeedIds } from "../list/getters"
import { getSubscribedFeedIdAndInboxHandlesByView } from "../subscription/getter"
import type {
  FeedIdOrInboxHandle,
  InsertedBeforeTimeRangeFilter,
  PublishAtTimeRangeFilter,
  UnreadState,
  UnreadStoreModel,
  UnreadUpdateOptions,
} from "./types"

const initialUnreadStore: UnreadState = {
  data: {},
}

export const useUnreadStore = createZustandStore<UnreadState>("unread")(() => initialUnreadStore)
const get = useUnreadStore.getState
const set = useUnreadStore.setState

type ReadEntryTarget = {
  entryId: string
  id: FeedIdOrInboxHandle
  isInbox: boolean
}

type TimeRangeFilter = PublishAtTimeRangeFilter | InsertedBeforeTimeRangeFilter

const countEntriesById = (entryIds: string[]): UnreadStoreModel => {
  const countById: UnreadStoreModel = {}

  for (const entryId of entryIds) {
    const entry = getEntry(entryId)
    const id = entry?.inboxHandle || entry?.feedId
    if (!id) continue

    countById[id] = (countById[id] || 0) + 1
  }

  return countById
}

const applyCountDelta = (
  counts: UnreadStoreModel,
  delta: UnreadStoreModel,
  direction: "increment" | "decrement",
) => {
  for (const [id, count] of Object.entries(delta)) {
    const current = counts[id] ?? 0
    counts[id] = direction === "increment" ? current + count : Math.max(0, current - count)
  }
}

const mergeEntryIds = (payloads: { entryIds: string[] }[]) =>
  Array.from(new Set(payloads.flatMap((payload) => payload.entryIds)))

const mergeCountIds = (payloads: { unreadCountById: UnreadStoreModel }[]) =>
  Array.from(new Set(payloads.flatMap((payload) => Object.keys(payload.unreadCountById))))

// ---------------------------------------------------------------------------
// Transaction kinds
// ---------------------------------------------------------------------------

interface MarkEntriesReadPayload {
  entryIds: string[]
  isInbox: boolean
  /** Unread entries per feed or inbox at the time the intent was recorded. */
  unreadCountById: UnreadStoreModel
}

interface MarkEntryUnreadPayload {
  entryId: string
  isInbox: boolean
  id: FeedIdOrInboxHandle
}

interface MarkAllReadPayload {
  /** Feed ids or inbox handles covered by the request. */
  ids: FeedIdOrInboxHandle[]
  /** Local entries that were unread when the intent was recorded. */
  entryIds: string[]
  args: MarkAllAsReadRequest
  time?: TimeRangeFilter
  /** Optimistic decrement per id. Equals the full count when no time filter is given. */
  unreadCountById: UnreadStoreModel
  /** Counts before the optimistic decrement, used to settle time-filtered requests. */
  unreadBefore: UnreadStoreModel
}

interface SyncedResult {
  lastSyncId?: number
}

export const markEntriesReadTransaction = defineTransactionKind<
  MarkEntriesReadPayload,
  SyncedResult
>({
  kind: "reads.mark-entries-read",
  batchKey: (payload) => (payload.isInbox ? "inbox" : "feed"),
  apply(payload) {
    const affected = entryActions.markEntryReadStatusInSession({
      entryIds: payload.entryIds,
      read: true,
    })
    unreadActions.changeBatchInSession(countEntriesById(affected), "decrement")
  },
  rollback(payload) {
    const affected = entryActions.markEntryReadStatusInSession({
      entryIds: payload.entryIds,
      read: false,
    })
    unreadActions.changeBatchInSession(countEntriesById(affected), "increment")
  },
  async execute(payloads) {
    const res = await api().reads.markAsRead({
      entryIds: mergeEntryIds(payloads),
      isInbox: payloads[0]!.isInbox,
    })
    return { lastSyncId: readLastSyncId(res) }
  },
  syncIdOf: (result) => result.lastSyncId,
  async persist(payloads, _result, { awaitsSync }) {
    await EntryService.patchMany({
      entry: { read: true },
      entryIds: mergeEntryIds(payloads),
    })
    // With a change log the server reports how many rows really flipped; guessing here as
    // well would count entries twice that another device had already marked.
    if (!awaitsSync) {
      await unreadActions.commitLocalEffect(mergeCountIds(payloads), (counts) => {
        for (const payload of payloads) {
          applyCountDelta(counts, payload.unreadCountById, "decrement")
        }
      })
    }
  },
  overlays: (payload) =>
    payload.entryIds.map((entryId) => ({ key: entryReadOverlayKey(entryId), value: true })),
  rebaseUnread: (payload, counts) => {
    applyCountDelta(counts, payload.unreadCountById, "decrement")
  },
})

export const markEntryUnreadTransaction = defineTransactionKind<
  MarkEntryUnreadPayload,
  SyncedResult
>({
  kind: "reads.mark-entry-unread",
  apply(payload) {
    const affected = entryActions.markEntryReadStatusInSession({
      entryIds: [payload.entryId],
      read: false,
    })
    if (affected.length > 0) {
      unreadActions.changeBatchInSession({ [payload.id]: 1 }, "increment")
    }
  },
  rollback(payload) {
    const affected = entryActions.markEntryReadStatusInSession({
      entryIds: [payload.entryId],
      read: true,
    })
    if (affected.length > 0) {
      unreadActions.changeBatchInSession({ [payload.id]: 1 }, "decrement")
    }
  },
  async execute(payloads) {
    const payload = payloads[0]!
    const res = await api().reads.markAsUnread({
      entryId: payload.entryId,
      isInbox: payload.isInbox,
    })
    return { lastSyncId: readLastSyncId(res) }
  },
  syncIdOf: (result) => result.lastSyncId,
  async persist(payloads, _result, { awaitsSync }) {
    const payload = payloads[0]!
    await EntryService.patchMany({
      entry: { read: false },
      entryIds: [payload.entryId],
    })
    if (!awaitsSync) {
      await unreadActions.commitLocalEffect([payload.id], (counts) => {
        applyCountDelta(counts, { [payload.id]: 1 }, "increment")
      })
    }
  },
  overlays: (payload) => [{ key: entryReadOverlayKey(payload.entryId), value: false }],
  rebaseUnread: (payload, counts) => {
    applyCountDelta(counts, { [payload.id]: 1 }, "increment")
  },
})

export const markAllReadTransaction = defineTransactionKind<
  MarkAllReadPayload,
  SyncedResult & { read: Record<string, number> }
>({
  kind: "reads.mark-all-read",
  apply(payload) {
    entryActions.markEntryReadStatusInSession({
      ids: payload.ids,
      read: true,
      time: payload.time,
    })
    if (payload.time) {
      unreadActions.changeBatchInSession(payload.unreadCountById, "decrement")
    } else {
      unreadActions.upsertManyInSession(
        payload.ids.map((id) => ({ id, count: 0 })),
        { optimistic: true },
      )
    }
  },
  async rollback(payload) {
    entryActions.markEntryReadStatusInSession({
      entryIds: payload.entryIds,
      read: false,
    })
    await unreadSyncService.resetFromRemote().catch((error) => {
      console.error(error)
    })
  },
  async execute(payloads) {
    const res = await api().reads.markAllAsRead(payloads[0]!.args)
    return { read: res.data.read, lastSyncId: readLastSyncId(res) }
  },
  syncIdOf: (result) => result.lastSyncId,
  async persist(payloads, { read }, { awaitsSync }) {
    const payload = payloads[0]!
    if (!payload.time) {
      // The server just marked everything in these feeds as read, so zero is confirmed
      // state. The flips the change log reports afterwards are clamped at zero.
      await unreadActions.upsertMany(payload.ids.map((id) => ({ id, count: 0 })))
    } else if (!awaitsSync) {
      const finalUnreadList = Array.from(new Set([...payload.ids, ...Object.keys(read)])).map(
        (id) => ({
          id,
          count: Math.max(0, (payload.unreadBefore[id] ?? get().data[id] ?? 0) - (read[id] || 0)),
        }),
      )
      await unreadActions.upsertMany(finalUnreadList)
    }

    await EntryService.patchMany({
      feedIds: payload.ids,
      entry: { read: true },
      time: payload.time,
    })
  },
  overlays: (payload) =>
    payload.entryIds.map((entryId) => ({ key: entryReadOverlayKey(entryId), value: true })),
  rebaseUnread: (payload, counts) => {
    if (payload.time) {
      applyCountDelta(counts, payload.unreadCountById, "decrement")
      return
    }
    for (const id of payload.ids) {
      counts[id] = 0
    }
  },
})

// ---------------------------------------------------------------------------
// Sync service
// ---------------------------------------------------------------------------

class UnreadSyncService {
  /**
   * Bring the counters up to date after a user gesture. The delta feed does it when the sync
   * engine runs; the recount is the fallback. A refresh the user asked for also recounts
   * through the engine, at most once a minute, so counters that drifted from the list on
   * screen do not wait for the hourly calibration.
   */
  async refresh({ calibrate = false }: { calibrate?: boolean } = {}) {
    if (await ensureSyncedThroughEngine()) {
      if (calibrate) await requestUnreadCalibration()
      return
    }
    await this.resetFromRemote()
  }

  /**
   * Replace the confirmed counters with the server's. The answer names the sync id the
   * counts reflect, so the change log is not applied on top of what the snapshot already
   * contains; `fallbackSyncId` stands in for servers that do not name it.
   */
  async resetFromRemote({ fallbackSyncId }: { fallbackSyncId?: number } = {}) {
    const res = await api().reads.get({})
    const snapshotSyncId = readLastSyncId(res) ?? fallbackSyncId

    if (!unreadActions.isConfirmedEqual(res.data)) {
      await unreadActions.upsertMany(res.data, { reset: true })
    }
    if (snapshotSyncId !== undefined) {
      await recordUnreadSnapshotThroughEngine(snapshotSyncId)
    }
    return res.data
  }

  private async markAllAsRead({
    ids,
    time,
    args,
  }: {
    ids: FeedIdOrInboxHandle[]
    time?: TimeRangeFilter
    args: MarkAllAsReadRequest
  }) {
    if (!ids || ids.length === 0) return

    const entryIds = entryActions.collectEntryIdsToMarkInSession({ ids, read: true, time })
    const unreadBefore = Object.fromEntries(ids.map((id) => [id, get().data[id] ?? 0]))
    const unreadCountById = time ? countEntriesById(entryIds) : { ...unreadBefore }

    ids.forEach((id) => {
      if (id) {
        setFeedUnreadDirty(id)
      }
    })

    await transactionQueue.enqueue(markAllReadTransaction, {
      ids,
      entryIds,
      args,
      time,
      unreadCountById,
      unreadBefore,
    })
  }

  async markBatchAsRead({
    view,
    filter,
    time,
    excludePrivate,
  }: {
    view: FeedViewType | undefined
    filter?: {
      feedId?: string
      listId?: string
      feedIdList?: string[]
      inboxId?: string
      insertedBefore?: number
    } | null
    time?: TimeRangeFilter
    excludePrivate: boolean
  }) {
    const args: MarkAllAsReadRequest = {
      view: view === FeedViewType.All ? undefined : view,
      excludePrivate,
      ...filter,
      ...time,
    }
    if (view === FeedViewType.All) {
      delete args.view
    }

    if (filter?.feedIdList) {
      await this.markAllAsRead({ ids: filter.feedIdList, time, args })
    } else if (filter?.feedId) {
      await this.markAllAsRead({ ids: [filter.feedId], time, args })
    } else if (filter?.listId) {
      const feedIds = getListFeedIds(filter.listId)
      if (feedIds && feedIds.length > 0) {
        await this.markAllAsRead({ ids: feedIds, time, args })
      }
    } else if (filter?.inboxId) {
      await this.markAllAsRead({ ids: [filter.inboxId], time, args })
    } else {
      const feedIdAndInboxHandles = getSubscribedFeedIdAndInboxHandlesByView({
        view,
        excludePrivate,
        excludeHidden: true,
      })
      await this.markAllAsRead({ ids: feedIdAndInboxHandles, time, args })
    }
  }

  async markViewAsRead(view: FeedViewType, excludePrivate: boolean) {
    await this.markBatchAsRead({
      view: view === FeedViewType.All ? undefined : view,
      excludePrivate,
    })
  }

  async markFeedAsRead(feedId: string | string[], time?: PublishAtTimeRangeFilter) {
    const feedIds = Array.isArray(feedId) ? feedId : [feedId]

    await this.markBatchAsRead({
      view: undefined,
      excludePrivate: false,
      filter: {
        feedIdList: feedIds,
      },
      time,
    })
  }

  async markListAsRead(listId: string, time?: PublishAtTimeRangeFilter) {
    await this.markBatchAsRead({
      view: undefined,
      excludePrivate: false,
      filter: {
        listId,
      },
      time,
    })
  }

  private getReadEntryTargets(entryIds: string[]): ReadEntryTarget[] {
    const seenEntryIds = new Set<string>()
    const targets: ReadEntryTarget[] = []

    for (const entryId of entryIds) {
      if (seenEntryIds.has(entryId)) continue
      seenEntryIds.add(entryId)

      const entry = getEntry(entryId)
      if (!entry || entry.read || (!entry.feedId && !entry.inboxHandle)) continue

      targets.push({
        entryId,
        id: entry.inboxHandle || entry.feedId || "",
        isInbox: !!entry.inboxHandle,
      })
    }

    return targets
  }

  /**
   * Record the intent to mark entries as read. The optimistic effect is applied at once;
   * adjacent marks are sent to the server in a single request by the transaction queue.
   */
  async markEntriesAsRead(entryIds: string[]) {
    const targets = this.getReadEntryTargets(entryIds)
    if (targets.length === 0) return

    const groups = [
      { isInbox: false, targets: targets.filter((target) => !target.isInbox) },
      { isInbox: true, targets: targets.filter((target) => target.isInbox) },
    ]

    for (const group of groups) {
      if (group.targets.length === 0) continue

      const unreadCountById = group.targets.reduce((acc, target) => {
        acc[target.id] = (acc[target.id] || 0) + 1
        return acc
      }, {} as UnreadStoreModel)

      Object.keys(unreadCountById).forEach((id) => {
        if (id) {
          setFeedUnreadDirty(id)
        }
      })

      await transactionQueue.enqueue(markEntriesReadTransaction, {
        entryIds: group.targets.map((target) => target.entryId),
        isInbox: group.isInbox,
        unreadCountById,
      })
    }
  }

  /**
   * @deprecated `markEntriesAsRead` already batches through the transaction queue.
   */
  queueEntriesAsRead(entryIds: string[]) {
    return this.markEntriesAsRead(entryIds)
  }

  private async markEntryReadStatus({ entryId, read }: { entryId: string; read: boolean }) {
    if (read) {
      return this.markEntriesAsRead([entryId])
    }

    const entry = getEntry(entryId)
    if (!entry || entry.read === read || (!entry.feedId && !entry.inboxHandle)) return

    const id: FeedIdOrInboxHandle = entry.inboxHandle || entry.feedId || ""
    const isInbox = !!entry.inboxHandle

    if (entry.feedId) {
      setFeedUnreadDirty(entry.feedId)
    }

    await transactionQueue.enqueue(markEntryUnreadTransaction, { entryId, isInbox, id })
  }

  async markEntryAsRead(entryId: string) {
    return this.markEntryReadStatus({ entryId, read: true })
  }

  async markEntryAsUnread(entryId: string) {
    return this.markEntryReadStatus({ entryId, read: false })
  }
}

// ---------------------------------------------------------------------------
// Store actions
// ---------------------------------------------------------------------------

type UnreadUpsertOptions = UnreadUpdateOptions & {
  /** @deprecated Every write that is not optimistic is confirmed state now. */
  fromRemote?: boolean
  /**
   * The write is the local guess of a transaction. It changes what is displayed but not the
   * confirmed counts, which only the server moves.
   */
  optimistic?: boolean
}

/**
 * Unread counters are derived on the server, so the client keeps two layers, like Linear
 * keeps a confirmed model under its local transactions:
 *
 * - the confirmed counts, moved by snapshots, by the change log and by transactions the
 *   server acknowledged without a change log, and the only thing written to the database;
 * - `data`, what the UI shows: the confirmed counts with every unsettled local transaction
 *   re-applied on top.
 *
 * A transaction therefore never has to predict its real effect: when the change log reports
 * what the server flipped, the prediction is simply dropped.
 */
class UnreadActions implements Hydratable, Resetable {
  private confirmed: UnreadStoreModel = {}

  async hydrate() {
    const unreads = await UnreadService.getUnreadAll()
    this.upsertManyInSession(unreads, { reset: true })
  }

  upsertManyInSession(unreads: UnreadSchema[], options?: UnreadUpsertOptions) {
    if (options?.optimistic) {
      const nextData = { ...useUnreadStore.getState().data }
      for (const unread of unreads) {
        nextData[unread.id] = unread.count
      }
      set({ data: nextData })
      return
    }

    if (options?.reset) {
      this.confirmed = {}
    }
    for (const unread of unreads) {
      this.confirmed[unread.id] = unread.count
    }
    this.syncDisplayedCounts(options?.reset ? undefined : unreads.map((unread) => unread.id))
  }

  /**
   * Derive the displayed counts from the confirmed ones and the unsettled local transactions.
   * Without `ids` everything is derived again, which also drops ids the server forgot.
   */
  syncDisplayedCounts(ids?: FeedIdOrInboxHandle[]) {
    const current = useUnreadStore.getState().data

    if (!ids) {
      const nextData = { ...this.confirmed }
      transactionQueue.rebaseUnreadCounts(nextData)
      if (!isEqual(nextData, current)) {
        set({ data: nextData })
      }
      return
    }

    if (ids.length === 0) return
    const scratch: UnreadStoreModel = {}
    for (const id of ids) {
      scratch[id] = this.confirmed[id] ?? 0
    }
    transactionQueue.rebaseUnreadCounts(scratch, new Set(ids))

    if (ids.every((id) => current[id] === scratch[id])) return
    const nextData = { ...current }
    for (const id of ids) {
      nextData[id] = scratch[id] ?? 0
    }
    set({ data: nextData })
  }

  isConfirmedEqual(counts: UnreadStoreModel) {
    return isEqual(counts, this.confirmed)
  }

  /** Adjust displayed counts only. Used by transaction kinds for optimistic effects. */
  changeBatchInSession(updates: UnreadStoreModel, type: "decrement" | "increment") {
    const entries = Object.entries(updates)
    if (entries.length === 0) return

    const nextData = { ...useUnreadStore.getState().data }
    applyCountDelta(nextData, updates, type)
    set({ data: nextData })
  }

  /**
   * Move confirmed counts by what the server reported: rows that flipped on any device, or
   * new unread entries. Increments commute, so the order of change-log pages does not matter.
   */
  async applyConfirmedDelta(deltas: UnreadStoreModel) {
    const ids = Object.keys(deltas).filter((id) => !!id && !!deltas[id])
    if (ids.length === 0) return

    for (const id of ids) {
      this.confirmed[id] = Math.max(0, (this.confirmed[id] ?? 0) + deltas[id]!)
    }
    this.syncDisplayedCounts(ids)
    await this.persistConfirmed(ids)
  }

  /**
   * Make the effect of an acknowledged transaction part of the confirmed counts. Only used
   * when no change log will report the real effect, so the prediction is all there is.
   */
  async commitLocalEffect(ids: FeedIdOrInboxHandle[], mutate: (counts: UnreadStoreModel) => void) {
    if (ids.length === 0) return
    const scratch: UnreadStoreModel = {}
    for (const id of ids) {
      scratch[id] = this.confirmed[id] ?? 0
    }
    mutate(scratch)
    for (const id of ids) {
      this.confirmed[id] = Math.max(0, scratch[id] ?? 0)
    }
    this.syncDisplayedCounts(ids)
    await this.persistConfirmed(ids)
  }

  private async persistConfirmed(ids: FeedIdOrInboxHandle[]) {
    await UnreadService.upsertMany(ids.map((id) => ({ id, count: this.confirmed[id] ?? 0 })))
  }

  async upsertMany(unreads: UnreadSchema[] | UnreadStoreModel, options?: UnreadUpsertOptions) {
    const normalizedUnreads = Array.isArray(unreads)
      ? unreads
      : Object.entries(unreads).map(([id, count]) => ({ id, count }))

    const tx = createTransaction()
    tx.store(() => this.upsertManyInSession(normalizedUnreads, options))
    // The database keeps the confirmed counts; pending transactions are replayed on top after a restart.
    tx.persist(() => UnreadService.upsertMany(normalizedUnreads, { reset: options?.reset }))
    await tx.run()
  }

  async changeBatch(updates: UnreadStoreModel, type: "decrement" | "increment") {
    const deltas: UnreadStoreModel = {}
    for (const [id, count] of Object.entries(updates)) {
      deltas[id] = type === "increment" ? count : -count
    }
    await this.applyConfirmedDelta(deltas)
  }

  addUnread(id: FeedIdOrInboxHandle, count = 1) {
    const cur = useUnreadStore.getState().data[id] ?? 0
    if (count <= 0) return cur
    void this.applyConfirmedDelta({ [id]: count })
    return cur
  }

  removeUnread(id: FeedIdOrInboxHandle, count = 1) {
    const cur = useUnreadStore.getState().data[id] ?? 0
    if (count <= 0) return cur
    void this.applyConfirmedDelta({ [id]: -count })
    return cur
  }

  incrementById(id: FeedIdOrInboxHandle, count: number) {
    return count > 0 ? this.addUnread(id, count) : this.removeUnread(id, -count)
  }

  async updateById(id: FeedIdOrInboxHandle | undefined | null, count: number) {
    if (!id) return
    if ((this.confirmed[id] ?? 0) === count && (useUnreadStore.getState().data[id] ?? 0) === count)
      return
    await this.upsertMany([{ id, count }])
  }

  subscribeUnreadCount(fn: (count: number) => void, immediately?: boolean) {
    const handler = (state: UnreadState): void => {
      let unread = 0
      for (const key in state.data) {
        unread += state.data[key] ?? 0
      }

      fn(unread)
    }
    if (immediately) {
      handler(get())
    }
    return useUnreadStore.subscribe(handler)
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      this.confirmed = {}
      set(initialUnreadStore)
    })

    tx.persist(() => {
      return UnreadService.reset()
    })

    await tx.run()
  }
}

export const unreadActions = new UnreadActions()
export const unreadSyncService = new UnreadSyncService()

// A settled transaction no longer overrides the confirmed counts. When the change log
// reported fewer flips than predicted, this is the moment the prediction is corrected.
transactionQueue.onSettled(({ records }) => {
  if (records.some((record) => record.kind.startsWith("reads."))) {
    unreadActions.syncDisplayedCounts()
  }
})
