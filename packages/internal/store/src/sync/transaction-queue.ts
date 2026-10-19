import { SyncTransactionService } from "@follow/database/services/sync-transaction"
import { FollowAPIError } from "@follow-app/client-sdk"

import { getLocalDataOwner, onSessionUserConfirmed, verifySessionUser } from "./account"
import { willSyncEngineDeliver } from "./sync-status"

/**
 * A Linear-style transaction queue.
 *
 * Every user mutation becomes a transaction: the optimistic effect is applied to the
 * in-memory stores immediately, the transaction is written to a local outbox, and it is
 * sent to the server in order. Transactions survive restarts (they are replayed from the
 * outbox), are retried for as long as the network or the server is unavailable, and are
 * rolled back only when the server definitively rejects them. While a transaction is
 * pending its overlays let readers rebase server snapshots on top of the local intent
 * instead of losing it. A transaction belongs to the account that made it and is only sent
 * with that account's session (see `account.ts`).
 */

export interface TransactionOverlay {
  key: string
  value: unknown
}

export interface TransactionKind<P, R = unknown> {
  kind: string
  /**
   * Apply the optimistic effect to the in-memory stores.
   * Must be idempotent: it is replayed after a restart.
   */
  apply: (payload: P) => void
  /** Undo the optimistic effect. Only called when the server definitively rejects the transaction. */
  rollback: (payload: P) => void | Promise<void>
  /** Send a batch of payloads to the server. */
  execute: (payloads: P[]) => Promise<R>
  /** Write the confirmed state to the local database after the server acknowledged the batch. */
  persist?: (payloads: P[], result: R, context: TransactionPersistContext) => void | Promise<void>
  /** Adjacent transactions with the same batch key are executed with a single `execute` call. */
  batchKey?: (payload: P) => string
  maxBatchSize?: number
  /** Overlay values keyed by resource, used to rebase server snapshots onto the local intent. */
  overlays?: (payload: P) => TransactionOverlay[]
  /** Re-apply the transaction's effect on unread counters that were just replaced by a server snapshot. */
  rebaseUnread?: (payload: P, counts: Record<string, number>) => void
  /**
   * The sync id the server assigned to the batch. With it, overlays are released as soon as
   * the sync engine has applied that id: the delta feed and the snapshot endpoints read from
   * the same replicas, so a snapshot fetched afterwards already contains the change.
   */
  syncIdOf?: (result: R) => number | undefined
  /**
   * Upper bound for how long an acknowledged transaction keeps its overlays. It is the only
   * release condition when the server returned no sync id or the sync engine is unavailable.
   */
  ackGraceMs?: number
}

/**
 * The parts of a transaction kind that still matter once the server confirmed the change, for
 * changes whose caller sends the request itself (see `trackAcknowledged`).
 */
export type AcknowledgedChangeKind<P> = Pick<TransactionKind<P>, "kind" | "overlays" | "ackGraceMs">

export interface TransactionPersistContext {
  /**
   * The server numbered the batch and the sync engine is running or bootstrapping, so the
   * change log will deliver what the batch really changed. Server-derived values such as
   * unread counters must then be left to the change log instead of being guessed from the
   * optimistic effect.
   */
  awaitsSync: boolean
}

export interface TransactionRecord<P = unknown> {
  id: string
  kind: string
  payload: P
  createdAt: number
  /**
   * The account that owned the local data when the change was made. `null` for changes made
   * before any account claimed it, and for outbox rows from before owners were recorded:
   * those belong to the owner of the local data.
   */
  userId: string | null
}

/** The server rejected a batch: its transactions were rolled back and dropped. */
export interface TransactionFailureEvent {
  /** The transactions of the batch, in the order they were made. */
  records: TransactionRecord[]
  error: unknown
}

export type TransactionFailureListener = (event: TransactionFailureEvent) => void

export interface TransactionAcknowledgedEvent {
  records: TransactionRecord[]
}

export type TransactionAcknowledgedListener = (event: TransactionAcknowledgedEvent) => void

export interface TransactionSettledEvent {
  records: TransactionRecord[]
}

/** Called when acknowledged transactions stop overriding server data. */
export type TransactionSettledListener = (event: TransactionSettledEvent) => void

interface QueuedTransaction<P = unknown> extends TransactionRecord<P> {
  definition: TransactionKind<P, unknown>
  settled: Promise<void>
  resolve: () => void
  reject: (error: unknown) => void
}

/** An acknowledged transaction keeps its record and the hooks that read its payload. */
interface AcknowledgedRecord extends TransactionRecord {
  definition: Pick<TransactionKind<unknown, unknown>, "overlays" | "rebaseUnread">
}

interface AcknowledgedTransaction {
  record: AcknowledgedRecord
  expiresAt: number
  syncId?: number
  awaitsSync: boolean
}

type ErrorDecision = "retry" | "pause" | "fail"

const FLUSH_DELAY_MS = 100
const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 60_000
/** Past this many failures in a row the retry delay stays at its maximum. */
const MAX_BACKOFF_EXPONENT = 16
const DEFAULT_MAX_BATCH_SIZE = 200
const DEFAULT_ACK_GRACE_MS = 30_000
/**
 * Upper bound for a transaction that waits for the change log. It is generous because the
 * change log is the only source of the transaction's real effect on server-derived values;
 * it only matters when pulls keep failing after the mutation itself went through.
 */
const SYNC_WAIT_MS = 5 * 60_000
const RETRYABLE_STATUS = new Set([408, 425, 429])

const noop = () => {}

const createTransactionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const isNavigatorOnline = () =>
  typeof navigator === "undefined" || navigator.onLine !== false

const isOnline = isNavigatorOnline

/**
 * Only an answer from the server can reject a change. A request that got no answer (no
 * connection, a timeout, the API down) or an answer that means "not now" (5xx, 408, 425,
 * 429) is retried until it goes through, however long the outage lasts: giving up would
 * throw away what the user did.
 */
export const classifyTransactionError = (error: unknown): ErrorDecision => {
  if (!(error instanceof FollowAPIError)) return "retry"
  if (error.status === 401) return "pause"
  if (error.status >= 500 || RETRYABLE_STATUS.has(error.status)) return "retry"
  return error.status >= 400 ? "fail" : "retry"
}

export const defineTransactionKind = <P, R = unknown>(
  definition: TransactionKind<P, R>,
): TransactionKind<P, R> => {
  transactionQueue.register(definition)
  return definition
}

class TransactionQueue {
  private definitions = new Map<string, TransactionKind<unknown, unknown>>()
  private queued: QueuedTransaction[] = []
  private inFlight = new Set<string>()
  private acknowledged: AcknowledgedTransaction[] = []
  private flushing: Promise<void> | null = null
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  /** Failed sends in a row; it only sets the retry delay, never when to give up. */
  private attempts = 0
  private paused = false
  private syncedThrough = 0
  /** The last unread snapshot already counts every change the server numbered up to this id. */
  private unreadSnapshotThrough = 0
  private version = 0
  private overlayCache: { version: number; overlays: Map<string, unknown> } | null = null
  private idleWaiters: Array<() => void> = []
  private failureListeners = new Set<TransactionFailureListener>()
  private acknowledgedListeners = new Set<TransactionAcknowledgedListener>()
  private settledListeners = new Set<TransactionSettledListener>()
  private environmentListenersAttached = false

  register<P, R>(definition: TransactionKind<P, R>) {
    this.definitions.set(definition.kind, definition as TransactionKind<unknown, unknown>)
  }

  /**
   * Apply the transaction optimistically, write it to the outbox and schedule a flush.
   * Resolves once the intent is safely recorded, not when the server acknowledges it.
   */
  async enqueue<P, R>(definition: TransactionKind<P, R>, payload: P): Promise<string> {
    this.register(definition)
    definition.apply(payload)

    const record = this.createQueuedTransaction(
      definition as TransactionKind<unknown, unknown>,
      payload,
      createTransactionId(),
      Date.now(),
      getLocalDataOwner(),
    )
    this.queued.push(record)
    this.touch()

    try {
      await SyncTransactionService.insert({
        id: record.id,
        kind: record.kind,
        payload: record.payload,
        createdAt: new Date(record.createdAt),
        userId: record.userId,
      })
    } catch (error) {
      console.error("[transaction-queue] failed to persist transaction to the outbox", error)
    }

    this.paused = false
    this.scheduleFlush()
    return record.id
  }

  /**
   * Replay transactions left in the outbox by a previous session.
   * Must run after the stores are hydrated so the optimistic effects apply on top of them.
   */
  async restore() {
    let rows: Awaited<ReturnType<typeof SyncTransactionService.getAll>> = []
    try {
      rows = await SyncTransactionService.getAll()
    } catch (error) {
      console.error("[transaction-queue] failed to load the outbox", error)
    }

    const restored: QueuedTransaction[] = []
    const orphaned: string[] = []
    for (const row of rows) {
      const definition = this.definitions.get(row.kind)
      if (!definition) {
        console.warn(`[transaction-queue] dropping transaction of unknown kind ${row.kind}`)
        orphaned.push(row.id)
        continue
      }
      try {
        definition.apply(row.payload)
      } catch (error) {
        console.error(`[transaction-queue] failed to replay ${row.kind}`, error)
      }
      restored.push(
        this.createQueuedTransaction(
          definition,
          row.payload,
          row.id,
          row.createdAt.getTime(),
          row.userId ?? null,
        ),
      )
    }

    if (orphaned.length > 0) {
      await SyncTransactionService.deleteMany(orphaned).catch(noop)
    }

    this.queued = [...restored, ...this.queued]
    this.touch()
    this.attachEnvironmentListeners()
    if (this.queued.length > 0) {
      this.scheduleFlush()
    }
  }

  /** Send queued transactions to the server in order. Safe to call at any time. */
  flush(): Promise<void> {
    if (this.flushing) return this.flushing
    this.clearFlushTimer()
    this.flushing = this.runFlush().finally(() => {
      this.flushing = null
      if (this.queued.length > 0 && !this.retryTimer && !this.paused && isOnline()) {
        this.scheduleFlush()
      }
      this.notifyIdleWaiters()
    })
    return this.flushing
  }

  /**
   * Called when the network, the API or the app comes back: retry immediately, and start the
   * back-off over, since the failures before it say nothing about the connection now.
   */
  resume() {
    this.paused = false
    this.attempts = 0
    this.clearRetryTimer()
    if (this.queued.length > 0) {
      void this.flush()
    }
  }

  /** Resolves when nothing is queued, in flight or scheduled. */
  whenIdle(): Promise<void> {
    if (this.isIdle()) return Promise.resolve()
    return new Promise((resolve) => {
      this.idleWaiters.push(resolve)
    })
  }

  /** Latest overlay value per key, from pending transactions and recently acknowledged ones. */
  getOverlays(): ReadonlyMap<string, unknown> {
    this.pruneAcknowledged()
    if (this.overlayCache?.version === this.version) {
      return this.overlayCache.overlays
    }
    const overlays = new Map<string, unknown>()
    for (const record of this.activeRecords()) {
      const entries = record.definition.overlays?.(record.payload)
      if (!entries) continue
      for (const entry of entries) {
        overlays.set(entry.key, entry.value)
      }
    }
    this.overlayCache = { version: this.version, overlays }
    return overlays
  }

  /**
   * Re-apply the unread effects of local transactions onto counts confirmed by the server:
   * everything still queued, plus acknowledged transactions whose real effect has not arrived
   * through the change log or an unread snapshot yet. Only keys in `touchedIds` are written
   * back; when omitted every key may change.
   */
  rebaseUnreadCounts(counts: Record<string, number>, touchedIds?: ReadonlySet<string>) {
    this.pruneAcknowledged()
    const scratch = { ...counts }
    for (const item of this.acknowledged) {
      if (!item.awaitsSync || this.isCountedByUnreadSnapshot(item)) continue
      item.record.definition.rebaseUnread?.(item.record.payload, scratch)
    }
    for (const record of this.queued) {
      record.definition.rebaseUnread?.(record.payload, scratch)
    }
    for (const key of Object.keys(scratch)) {
      if (!touchedIds || touchedIds.has(key)) {
        counts[key] = scratch[key]!
      }
    }
  }

  getPendingCount() {
    return this.queued.length
  }

  /**
   * Keep the overlays of a change the caller sent itself, because it needs the server's answer
   * before going on, as if the queue had sent it: they override older server data until the
   * sync engine applied `syncId`. Without a sync id or a running engine the grace period ends
   * them instead.
   */
  trackAcknowledged<P>(definition: AcknowledgedChangeKind<P>, payload: P, syncId?: number) {
    const awaitsSync = syncId !== undefined && willSyncEngineDeliver()
    const now = Date.now()
    const record: AcknowledgedRecord = {
      id: createTransactionId(),
      kind: definition.kind,
      payload,
      createdAt: now,
      userId: getLocalDataOwner(),
      definition: definition as AcknowledgedRecord["definition"],
    }
    this.acknowledged.push({
      record,
      expiresAt:
        now + (awaitsSync ? SYNC_WAIT_MS : (definition.ackGraceMs ?? DEFAULT_ACK_GRACE_MS)),
      syncId,
      awaitsSync,
    })
    this.touch()
    // The sync engine may already be past this id.
    this.pruneAcknowledged()
    this.notifyAcknowledged([record])
  }

  /**
   * The sync engine applied the change log up to `lastSyncId`. Acknowledged transactions the
   * server numbered at or below it are settled and stop overriding server data.
   */
  markSynced(lastSyncId: number) {
    if (lastSyncId <= this.syncedThrough) return
    this.syncedThrough = lastSyncId
    this.pruneAcknowledged()
  }

  /**
   * An unread snapshot that reflects the change log up to `syncId` became the confirmed
   * counts. Acknowledged changes the server numbered up to it are counted by it already, so
   * they stop being re-applied on top, while their overlays stay until the sync engine applied
   * them. Returns whether that is new for any of them.
   */
  markUnreadSnapshot(syncId: number): boolean {
    if (syncId <= this.unreadSnapshotThrough) return false
    const previous = this.unreadSnapshotThrough
    this.unreadSnapshotThrough = syncId
    return this.acknowledged.some(
      (item) =>
        item.awaitsSync &&
        item.syncId !== undefined &&
        item.syncId > previous &&
        item.syncId <= syncId,
    )
  }

  onFailure(listener: TransactionFailureListener) {
    this.failureListeners.add(listener)
    return () => {
      this.failureListeners.delete(listener)
    }
  }

  /** Called after the server acknowledged a batch and the confirmed state was persisted. */
  onAcknowledged(listener: TransactionAcknowledgedListener) {
    this.acknowledgedListeners.add(listener)
    return () => {
      this.acknowledgedListeners.delete(listener)
    }
  }

  /**
   * Called after acknowledged transactions were released, because the sync engine caught up
   * with them or their grace period ran out.
   */
  onSettled(listener: TransactionSettledListener) {
    this.settledListeners.add(listener)
    return () => {
      this.settledListeners.delete(listener)
    }
  }

  /** Drop every pending transaction from memory and from the outbox. Used on logout. */
  async reset() {
    this.clearInSession()
    await SyncTransactionService.reset().catch((error) => {
      console.error("[transaction-queue] failed to clear the outbox", error)
    })
  }

  /** Drop in-memory state only. */
  clearInSession() {
    this.clearFlushTimer()
    this.clearRetryTimer()
    for (const record of this.queued) {
      record.resolve()
    }
    this.queued = []
    this.inFlight.clear()
    this.acknowledged = []
    this.attempts = 0
    this.paused = false
    this.syncedThrough = 0
    this.unreadSnapshotThrough = 0
    this.touch()
    this.notifyIdleWaiters()
  }

  private async runFlush() {
    while (this.queued.length > 0) {
      if (!isOnline() || this.paused) return

      // The credentials may belong to another account than the one that made the change, as
      // when a dead session was replaced by a sign-in to another account. Until the session
      // endpoint said whose they are, nothing is sent.
      const sessionUserId = await verifySessionUser()
      if (sessionUserId === undefined) {
        // The session endpoint could not be reached either: wait as for any failed request.
        this.attempts += 1
        this.scheduleRetry()
        return
      }
      // The queue may have been cleared while the session endpoint answered.
      const head = this.queued[0]
      if (!head) return
      const owner = this.ownerOf(head)
      if (
        sessionUserId !== null &&
        owner !== sessionUserId &&
        sessionUserId === getLocalDataOwner()
      ) {
        // A change of an account whose data is not on this device: it can never be sent, and
        // it must not hold back the changes of the account that is.
        await this.discard(head)
        continue
      }
      if (sessionUserId === null || owner !== sessionUserId) {
        // Signed out, or signed in as another account: the change waits for its own account,
        // whose next confirmed session resumes the queue.
        this.paused = true
        return
      }

      const batch = this.takeBatch()
      const { definition } = batch[0]!
      this.inFlight = new Set(batch.map((record) => record.id))
      this.touch()

      let result: unknown
      try {
        result = await definition.execute(batch.map((record) => record.payload))
      } catch (error) {
        this.inFlight.clear()
        this.touch()
        if (!this.isStillQueued(batch)) continue

        const decision = classifyTransactionError(error)
        if (decision === "retry") {
          this.attempts += 1
          this.scheduleRetry()
          return
        }
        if (decision === "pause") {
          this.paused = true
          return
        }
        // The server answered, so the next batch starts with a fresh back-off.
        this.attempts = 0
        await this.failBatch(batch, error)
        continue
      }

      this.attempts = 0
      this.inFlight.clear()
      if (!this.isStillQueued(batch)) continue
      await this.completeBatch(batch, result)
    }
  }

  private takeBatch(): QueuedTransaction[] {
    const head = this.queued[0]!
    const batch = [head]
    const { batchKey, maxBatchSize = DEFAULT_MAX_BATCH_SIZE } = head.definition
    if (!batchKey) return batch

    const key = batchKey(head.payload)
    const owner = this.ownerOf(head)
    for (let index = 1; index < this.queued.length && batch.length < maxBatchSize; index++) {
      const candidate = this.queued[index]!
      if (candidate.kind !== head.kind || batchKey(candidate.payload) !== key) break
      if (this.ownerOf(candidate) !== owner) break
      batch.push(candidate)
    }
    return batch
  }

  private ownerOf(record: TransactionRecord) {
    return record.userId ?? getLocalDataOwner()
  }

  private async completeBatch(batch: QueuedTransaction[], result: unknown) {
    const { definition } = batch[0]!
    const syncId = definition.syncIdOf?.(result)
    const awaitsSync = syncId !== undefined && willSyncEngineDeliver()
    const keepsAcknowledged = !!definition.overlays || !!definition.rebaseUnread

    // Hand the batch over from the queue to the acknowledged list in one step, so readers
    // that rebase server data never see a moment in which the transaction is in neither.
    this.removeFromQueue(batch)
    if (keepsAcknowledged) {
      const expiresAt =
        Date.now() + (awaitsSync ? SYNC_WAIT_MS : (definition.ackGraceMs ?? DEFAULT_ACK_GRACE_MS))
      for (const record of batch) {
        this.acknowledged.push({ record, expiresAt, syncId, awaitsSync })
      }
    }
    this.touch()

    try {
      await definition.persist?.(
        batch.map((record) => record.payload),
        result,
        { awaitsSync },
      )
    } catch (error) {
      console.error(`[transaction-queue] failed to persist ${definition.kind}`, error)
    }

    await SyncTransactionService.deleteMany(batch.map((record) => record.id)).catch((error) => {
      console.error("[transaction-queue] failed to remove transactions from the outbox", error)
    })

    // The sync engine may already be past this id, for instance when a pull overtook the response.
    this.pruneAcknowledged()

    for (const record of batch) {
      record.resolve()
    }

    this.notifyAcknowledged(batch)
  }

  private notifyAcknowledged(records: TransactionRecord[]) {
    for (const listener of this.acknowledgedListeners) {
      try {
        listener({ records })
      } catch (listenerError) {
        console.error("[transaction-queue] acknowledged listener threw", listenerError)
      }
    }
  }

  private async failBatch(batch: QueuedTransaction[], error: unknown) {
    this.removeFromQueue(batch)

    for (const record of batch) {
      try {
        await record.definition.rollback(record.payload)
      } catch (rollbackError) {
        console.error(`[transaction-queue] failed to roll back ${record.kind}`, rollbackError)
      }
    }

    await SyncTransactionService.deleteMany(batch.map((record) => record.id)).catch(noop)
    this.touch()

    for (const record of batch) {
      record.reject(error)
    }
    // Once per batch: the marks of a scroll are one gesture to the user, and one request.
    for (const listener of this.failureListeners) {
      try {
        listener({ records: batch, error })
      } catch (listenerError) {
        console.error("[transaction-queue] failure listener threw", listenerError)
      }
    }
  }

  /** Forget a transaction without rolling it back or reporting a failure. */
  private async discard(record: QueuedTransaction) {
    console.warn(`[transaction-queue] dropping ${record.kind} of another account`)
    this.removeFromQueue([record])
    await SyncTransactionService.deleteMany([record.id]).catch(noop)
    record.resolve()
  }

  private createQueuedTransaction(
    definition: TransactionKind<unknown, unknown>,
    payload: unknown,
    id: string,
    createdAt: number,
    userId: string | null,
  ): QueuedTransaction {
    let resolve: () => void = noop
    let reject: (error: unknown) => void = noop
    const settled = new Promise<void>((res, rej) => {
      resolve = res
      reject = rej
    })
    // Nobody is required to observe the outcome; avoid unhandled rejections.
    settled.catch(noop)

    return {
      id,
      kind: definition.kind,
      payload,
      createdAt,
      userId,
      definition,
      settled,
      resolve,
      reject,
    }
  }

  private activeRecords(): AcknowledgedRecord[] {
    return [...this.acknowledged.map((item) => item.record), ...this.queued]
  }

  private pruneAcknowledged() {
    if (this.acknowledged.length === 0) return
    const now = Date.now()
    const next: AcknowledgedTransaction[] = []
    const settled: AcknowledgedRecord[] = []
    for (const item of this.acknowledged) {
      const pending =
        item.expiresAt > now && (item.syncId === undefined || item.syncId > this.syncedThrough)
      if (pending) {
        next.push(item)
      } else {
        settled.push(item.record)
      }
    }
    if (settled.length === 0) return

    this.acknowledged = next
    this.touch()
    for (const listener of this.settledListeners) {
      try {
        listener({ records: settled })
      } catch (listenerError) {
        console.error("[transaction-queue] settled listener threw", listenerError)
      }
    }
  }

  private isCountedByUnreadSnapshot(item: AcknowledgedTransaction) {
    return item.syncId !== undefined && item.syncId <= this.unreadSnapshotThrough
  }

  private isStillQueued(batch: QueuedTransaction[]) {
    const ids = new Set(this.queued.map((record) => record.id))
    return batch.every((record) => ids.has(record.id))
  }

  private removeFromQueue(batch: QueuedTransaction[]) {
    const ids = new Set(batch.map((record) => record.id))
    this.queued = this.queued.filter((record) => !ids.has(record.id))
    this.touch()
  }

  private scheduleFlush() {
    // While a retry is pending, new transactions wait for it and go out in the same batch.
    // Sending each one at once would hit the unreachable server once per gesture.
    if (this.flushTimer || this.flushing || this.retryTimer) return
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      void this.flush()
    }, FLUSH_DELAY_MS)
  }

  private scheduleRetry() {
    this.clearRetryTimer()
    const exponent = Math.min(MAX_BACKOFF_EXPONENT, Math.max(0, this.attempts - 1))
    const delay = Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** exponent)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.flush()
    }, delay)
  }

  private clearFlushTimer() {
    if (!this.flushTimer) return
    clearTimeout(this.flushTimer)
    this.flushTimer = null
  }

  private clearRetryTimer() {
    if (!this.retryTimer) return
    clearTimeout(this.retryTimer)
    this.retryTimer = null
  }

  private isIdle() {
    return !this.flushing && this.queued.length === 0 && !this.flushTimer && !this.retryTimer
  }

  private notifyIdleWaiters() {
    if (!this.isIdle() || this.idleWaiters.length === 0) return
    const waiters = this.idleWaiters
    this.idleWaiters = []
    for (const resolve of waiters) {
      resolve()
    }
  }

  private touch() {
    this.version += 1
  }

  private attachEnvironmentListeners() {
    if (this.environmentListenersAttached) return
    this.environmentListenersAttached = true

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

export const transactionQueue = new TransactionQueue()

// A session confirmed for the account of the queued changes, as after signing in again, sends
// them at once instead of at the next gesture or return to the app.
onSessionUserConfirmed((userId) => {
  if (userId) transactionQueue.resume()
})
