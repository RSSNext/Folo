import { FollowAPIError } from "@follow-app/client-sdk"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearAccountInSession,
  getLocalDataOwner,
  invalidateSessionUser,
  registerSessionVerifier,
  startSessionCheck,
} from "./account"
import { setSyncEngineActive } from "./sync-status"
import type { TransactionKind, TransactionPersistContext } from "./transaction-queue"
import { classifyTransactionError, transactionQueue } from "./transaction-queue"

const { outboxRows, outboxInsertMock, outboxDeleteManyMock, outboxGetAllMock, outboxResetMock } =
  vi.hoisted(() => {
    const outboxRows: Array<{
      id: string
      kind: string
      payload: unknown
      createdAt: Date
      userId?: string | null
    }> = []
    return {
      outboxRows,
      outboxInsertMock: vi.fn(async (row: (typeof outboxRows)[number]) => {
        outboxRows.push(row)
      }),
      outboxDeleteManyMock: vi.fn(async (ids: string[]) => {
        for (const id of ids) {
          const index = outboxRows.findIndex((row) => row.id === id)
          if (index !== -1) outboxRows.splice(index, 1)
        }
      }),
      outboxGetAllMock: vi.fn(async () => [...outboxRows]),
      outboxResetMock: vi.fn(async () => {
        outboxRows.length = 0
      }),
    }
  })

vi.mock("@follow/database/services/sync-meta", () => ({
  SyncMetaService: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
  },
}))

vi.mock("@follow/database/services/sync-transaction", () => ({
  SyncTransactionService: {
    insert: outboxInsertMock,
    deleteMany: outboxDeleteManyMock,
    getAll: outboxGetAllMock,
    reset: outboxResetMock,
  },
}))

type CounterPayload = { key: string; delta: number }

const counters: Record<string, number> = {}
const persisted: Record<string, number> = {}

const createCounterKind = (
  overrides: Partial<TransactionKind<CounterPayload, unknown>> = {},
): TransactionKind<CounterPayload, unknown> => ({
  kind: "test.counter",
  apply: ({ key, delta }) => {
    counters[key] = (counters[key] ?? 0) + delta
  },
  rollback: ({ key, delta }) => {
    counters[key] = (counters[key] ?? 0) - delta
  },
  execute: vi.fn(async () => {}),
  persist: async (payloads) => {
    for (const { key, delta } of payloads) {
      persisted[key] = (persisted[key] ?? 0) + delta
    }
  },
  batchKey: ({ key }) => key,
  overlays: ({ key, delta }) => [{ key: `counter:${key}`, value: delta }],
  rebaseUnread: ({ key, delta }, counts) => {
    counts[key] = (counts[key] ?? 0) + delta
  },
  ...overrides,
})

const flushMicrotasks = () => vi.advanceTimersByTimeAsync(0)

/** The session endpoint answered for the current credentials. */
const signInAs = (userId: string | null) => startSessionCheck().confirm(userId)

/** A fresh launch: nobody owns the local data and the session is unknown. */
const launch = () => {
  clearAccountInSession()
  registerSessionVerifier(async () => {})
}

// Stands in for the window: the queue attaches its listeners once, on the first restore.
const windowEvents = new EventTarget()
beforeAll(() => {
  vi.stubGlobal("addEventListener", windowEvents.addEventListener.bind(windowEvents))
})
afterAll(() => {
  vi.unstubAllGlobals()
})

const setNavigatorOnline = (online: boolean | undefined) => {
  if (online === undefined) {
    delete (navigator as { onLine?: boolean }).onLine
    return
  }
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => online,
  })
}

describe("transactionQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    transactionQueue.clearInSession()
    launch()
    signInAs("user-1")
    outboxRows.length = 0
    for (const key of Object.keys(counters)) delete counters[key]
    for (const key of Object.keys(persisted)) delete persisted[key]
    vi.clearAllMocks()
  })

  afterEach(() => {
    transactionQueue.clearInSession()
    setSyncEngineActive(false)
    vi.useRealTimers()
  })

  it("applies optimistically, records the intent, then sends and persists it", async () => {
    const kind = createCounterKind()

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })

    expect(counters.a).toBe(1)
    expect(outboxRows).toHaveLength(1)
    expect(kind.execute).not.toHaveBeenCalled()
    expect(persisted.a).toBeUndefined()

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(kind.execute).toHaveBeenCalledTimes(1)
    expect(persisted.a).toBe(1)
    expect(outboxRows).toHaveLength(0)
  })

  it("batches adjacent transactions with the same batch key and keeps order across keys", async () => {
    const kind = createCounterKind()

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await transactionQueue.enqueue(kind, { key: "a", delta: 2 })
    await transactionQueue.enqueue(kind, { key: "b", delta: 5 })
    await transactionQueue.enqueue(kind, { key: "a", delta: 3 })

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    const calls = (kind.execute as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0])
    expect(calls).toEqual([
      [
        { key: "a", delta: 1 },
        { key: "a", delta: 2 },
      ],
      [{ key: "b", delta: 5 }],
      [{ key: "a", delta: 3 }],
    ])
    expect(persisted).toEqual({ a: 6, b: 5 })
  })

  it("retries transient failures with backoff and keeps the optimistic state", async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new FollowAPIError("boom", 503))
      .mockResolvedValue(undefined)
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100)
    await flushMicrotasks()

    expect(execute).toHaveBeenCalledTimes(1)
    expect(counters.a).toBe(1)
    expect(transactionQueue.getPendingCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(1000)
    await flushMicrotasks()
    expect(execute).toHaveBeenCalledTimes(2)
    expect(transactionQueue.getPendingCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(2000)
    await transactionQueue.whenIdle()
    expect(execute).toHaveBeenCalledTimes(3)
    expect(transactionQueue.getPendingCount()).toBe(0)
    expect(persisted.a).toBe(1)
  })

  it("rolls back and drops the transaction when the server rejects it", async () => {
    const execute = vi.fn().mockRejectedValue(new FollowAPIError("nope", 422))
    const kind = createCounterKind({ execute })
    const failures: unknown[] = []
    const unsubscribe = transactionQueue.onFailure((event) =>
      failures.push(event.records.map((record) => record.payload)),
    )

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await transactionQueue.enqueue(kind, { key: "a", delta: 2 })
    expect(counters.a).toBe(3)

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(counters.a).toBe(0)
    expect(persisted.a).toBeUndefined()
    expect(outboxRows).toHaveLength(0)
    // One report for the batch the server rejected.
    expect(failures).toEqual([
      [
        { key: "a", delta: 1 },
        { key: "a", delta: 2 },
      ],
    ])
    unsubscribe()
  })

  it("pauses on 401 and resumes when asked", async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new FollowAPIError("auth", 401))
      .mockResolvedValue(undefined)
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100)
    await flushMicrotasks()

    expect(execute).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(transactionQueue.getPendingCount()).toBe(1)

    transactionQueue.resume()
    await transactionQueue.whenIdle()
    expect(execute).toHaveBeenCalledTimes(2)
    expect(transactionQueue.getPendingCount()).toBe(0)
  })

  it("does not send while offline and flushes once back online", async () => {
    const kind = createCounterKind()
    setNavigatorOnline(false)

    try {
      await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
      await vi.advanceTimersByTimeAsync(100)
      await flushMicrotasks()
      expect(kind.execute).not.toHaveBeenCalled()
      expect(counters.a).toBe(1)

      setNavigatorOnline(true)
      transactionQueue.resume()
      await transactionQueue.whenIdle()
      expect(kind.execute).toHaveBeenCalledTimes(1)
    } finally {
      setNavigatorOnline(undefined)
    }
  })

  it("replays the outbox on restore before sending it", async () => {
    const kind = createCounterKind()
    transactionQueue.register(kind)
    outboxRows.push(
      { id: "t1", kind: kind.kind, payload: { key: "a", delta: 2 }, createdAt: new Date(1) },
      { id: "t2", kind: "test.unknown", payload: {}, createdAt: new Date(2) },
    )

    await transactionQueue.restore()

    expect(counters.a).toBe(2)
    expect(outboxDeleteManyMock).toHaveBeenCalledWith(["t2"])
    expect(transactionQueue.getPendingCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()
    expect(kind.execute).toHaveBeenCalledWith([{ key: "a", delta: 2 }])
    expect(persisted.a).toBe(2)
  })

  it("exposes overlays while pending and during the ack grace window", async () => {
    const kind = createCounterKind({ ackGraceMs: 1000 })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    expect(transactionQueue.getOverlays().get("counter:a")).toBe(1)

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()
    expect(transactionQueue.getOverlays().get("counter:a")).toBe(1)

    await vi.advanceTimersByTimeAsync(1001)
    expect(transactionQueue.getOverlays().get("counter:a")).toBeUndefined()
  })

  it("releases overlays once the sync engine applied the transaction's sync id", async () => {
    const kind = createCounterKind({
      execute: vi.fn(async () => ({ lastSyncId: 42 })),
      syncIdOf: (result) => (result as { lastSyncId?: number }).lastSyncId,
      ackGraceMs: 60_000,
    })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()
    expect(transactionQueue.getOverlays().get("counter:a")).toBe(1)

    transactionQueue.markSynced(41)
    expect(transactionQueue.getOverlays().get("counter:a")).toBe(1)

    transactionQueue.markSynced(42)
    expect(transactionQueue.getOverlays().get("counter:a")).toBeUndefined()
  })

  it("keeps rebasing an acknowledged transaction until the change log caught up, then reports it settled", async () => {
    setSyncEngineActive(true)
    const persistContexts: TransactionPersistContext[] = []
    const kind = createCounterKind({
      execute: vi.fn(async () => ({ lastSyncId: 42 })),
      syncIdOf: (result) => (result as { lastSyncId?: number }).lastSyncId,
      persist: async (_payloads, _result, context) => {
        persistContexts.push(context)
      },
    })
    const settled = vi.fn()
    const stopListening = transactionQueue.onSettled(settled)

    await transactionQueue.enqueue(kind, { key: "a", delta: -1 })
    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(persistContexts).toEqual([{ awaitsSync: true }])
    const beforeSync = { a: 5 }
    transactionQueue.rebaseUnreadCounts(beforeSync)
    expect(beforeSync).toEqual({ a: 4 })
    // The ordinary grace period does not release it: only the change log knows the real effect.
    await vi.advanceTimersByTimeAsync(60_000)
    transactionQueue.rebaseUnreadCounts(beforeSync)
    expect(beforeSync).toEqual({ a: 3 })
    expect(settled).not.toHaveBeenCalled()

    transactionQueue.markSynced(42)

    expect(settled).toHaveBeenCalledTimes(1)
    expect(
      settled.mock.calls[0]![0].records.map((record: { kind: string }) => record.kind),
    ).toEqual(["test.counter"])
    const afterSync = { a: 5 }
    transactionQueue.rebaseUnreadCounts(afterSync)
    expect(afterSync).toEqual({ a: 5 })

    stopListening()
  })

  it("stops rebasing an acknowledged transaction that an unread snapshot already counts", async () => {
    setSyncEngineActive(true)
    const kind = createCounterKind({
      execute: vi.fn(async () => ({ lastSyncId: 42 })),
      syncIdOf: (result) => (result as { lastSyncId?: number }).lastSyncId,
    })

    await transactionQueue.enqueue(kind, { key: "a", delta: -1 })
    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    // A snapshot from before the change does not count it.
    expect(transactionQueue.markUnreadSnapshot(41)).toBe(false)
    const before = { a: 5 }
    transactionQueue.rebaseUnreadCounts(before)
    expect(before).toEqual({ a: 4 })

    // One that reflects its id does: the change is not taken off it again.
    expect(transactionQueue.markUnreadSnapshot(45)).toBe(true)
    const after = { a: 4 }
    transactionQueue.rebaseUnreadCounts(after)
    expect(after).toEqual({ a: 4 })
    // Its overlays wait for the change log as before.
    expect(transactionQueue.getOverlays().get("counter:a")).toBe(-1)
    expect(transactionQueue.markUnreadSnapshot(44)).toBe(false)
  })

  it("settles at once when the engine is already past the acknowledged sync id", async () => {
    setSyncEngineActive(true)
    transactionQueue.markSynced(50)
    const kind = createCounterKind({
      execute: vi.fn(async () => ({ lastSyncId: 42 })),
      syncIdOf: (result) => (result as { lastSyncId?: number }).lastSyncId,
    })
    const settled = vi.fn()
    const stopListening = transactionQueue.onSettled(settled)

    await transactionQueue.enqueue(kind, { key: "a", delta: -1 })
    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(settled).toHaveBeenCalledTimes(1)
    expect(transactionQueue.getOverlays().get("counter:a")).toBeUndefined()
    stopListening()
  })

  it("does not rebase acknowledged transactions when no change log will follow", async () => {
    const persistContexts: TransactionPersistContext[] = []
    const kind = createCounterKind({
      execute: vi.fn(async () => ({ lastSyncId: 42 })),
      syncIdOf: (result) => (result as { lastSyncId?: number }).lastSyncId,
      persist: async (_payloads, _result, context) => {
        persistContexts.push(context)
      },
    })

    await transactionQueue.enqueue(kind, { key: "a", delta: -1 })
    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    // The engine is not running, so the kind commits its prediction itself.
    expect(persistContexts).toEqual([{ awaitsSync: false }])
    const counts = { a: 5 }
    transactionQueue.rebaseUnreadCounts(counts)
    expect(counts).toEqual({ a: 5 })
    expect(transactionQueue.getOverlays().get("counter:a")).toBe(-1)
  })

  it("keeps the overlays of a change sent outside the queue until the change log caught up", async () => {
    setSyncEngineActive(true)
    const acknowledged = vi.fn()
    const settled = vi.fn()
    const stopAcknowledged = transactionQueue.onAcknowledged(acknowledged)
    const stopSettled = transactionQueue.onSettled(settled)
    const kind = {
      kind: "test.confirmed",
      overlays: ({ key }: CounterPayload) => [{ key: `confirmed:${key}`, value: key }],
    }

    transactionQueue.trackAcknowledged(kind, { key: "a", delta: 1 }, 42)

    expect(acknowledged).toHaveBeenCalledTimes(1)
    expect(transactionQueue.getPendingCount()).toBe(0)
    expect(outboxRows).toHaveLength(0)
    expect(transactionQueue.getOverlays().get("confirmed:a")).toBe("a")
    // Only the change log ends it, not the ordinary grace period.
    await vi.advanceTimersByTimeAsync(60_000)
    transactionQueue.markSynced(41)
    expect(transactionQueue.getOverlays().get("confirmed:a")).toBe("a")

    transactionQueue.markSynced(42)
    expect(transactionQueue.getOverlays().get("confirmed:a")).toBeUndefined()
    expect(settled).toHaveBeenCalledTimes(1)

    // A change the engine already applied is settled at once.
    transactionQueue.trackAcknowledged(kind, { key: "b", delta: 1 }, 40)
    expect(transactionQueue.getOverlays().get("confirmed:b")).toBeUndefined()

    // Without a sync id, the grace period ends it.
    transactionQueue.trackAcknowledged({ ...kind, ackGraceMs: 1000 }, { key: "c", delta: 1 })
    expect(transactionQueue.getOverlays().get("confirmed:c")).toBe("c")
    await vi.advanceTimersByTimeAsync(1001)
    expect(transactionQueue.getOverlays().get("confirmed:c")).toBeUndefined()

    stopAcknowledged()
    stopSettled()
  })

  it("rebases unread counts with pending transactions only", async () => {
    const execute = vi.fn(() => new Promise<void>(() => {}))
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: -1 })
    await transactionQueue.enqueue(kind, { key: "b", delta: 2 })

    const counts = { a: 5, c: 1 }
    transactionQueue.rebaseUnreadCounts(counts, new Set(["a"]))
    expect(counts).toEqual({ a: 4, c: 1 })

    const allCounts = { a: 5 }
    transactionQueue.rebaseUnreadCounts(allCounts)
    expect(allCounts).toEqual({ a: 4, b: 2 })
  })

  it("clears memory and the outbox on reset", async () => {
    const kind = createCounterKind({ execute: vi.fn(() => new Promise<void>(() => {})) })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await transactionQueue.reset()

    expect(transactionQueue.getPendingCount()).toBe(0)
    expect(outboxResetMock).toHaveBeenCalledTimes(1)
    expect(transactionQueue.getOverlays().size).toBe(0)
  })
})

describe("transactionQueue during outages", () => {
  // What expo/fetch rejects with on a device without a connection.
  const offlineError = () =>
    new Error("fetch failed: UnexpectedException: The Internet connection appears to be offline.")

  beforeEach(() => {
    vi.useFakeTimers()
    transactionQueue.clearInSession()
    launch()
    signInAs("user-1")
    outboxRows.length = 0
    for (const key of Object.keys(counters)) delete counters[key]
    for (const key of Object.keys(persisted)) delete persisted[key]
    vi.clearAllMocks()
  })

  afterEach(() => {
    transactionQueue.clearInSession()
    vi.useRealTimers()
  })

  it.each([
    ["the connection is gone", offlineError],
    ["the request times out", () => new FollowAPIError("timeout", 408)],
    ["the server is down", () => new FollowAPIError("unavailable", 503)],
  ])("keeps the change and its outbox row while %s, then sends it once", async (_, error) => {
    let reachable = false
    const execute = vi.fn(async () => {
      if (!reachable) throw error()
    })
    const kind = createCounterKind({ execute })
    const failures = vi.fn()
    const stopListening = transactionQueue.onFailure(failures)

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    // Ten minutes is far past the old budget of eight attempts, about two minutes.
    await vi.advanceTimersByTimeAsync(10 * 60_000)

    expect(execute.mock.calls.length).toBeGreaterThan(8)
    expect(counters.a).toBe(1)
    expect(outboxRows).toHaveLength(1)
    expect(transactionQueue.getPendingCount()).toBe(1)
    expect(failures).not.toHaveBeenCalled()

    reachable = true
    const callsBefore = execute.mock.calls.length
    transactionQueue.resume()
    await transactionQueue.whenIdle()

    expect(execute).toHaveBeenCalledTimes(callsBefore + 1)
    expect(persisted.a).toBe(1)
    expect(outboxRows).toHaveLength(0)
    stopListening()
  })

  it("keeps changes through any number of returns to the app while offline", async () => {
    const execute = vi.fn(async () => {
      throw offlineError()
    })
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(200)
    for (let index = 0; index < 20; index++) {
      transactionQueue.resume()
      await vi.advanceTimersByTimeAsync(500)
    }

    expect(execute.mock.calls.length).toBeGreaterThan(8)
    expect(counters.a).toBe(1)
    expect(outboxRows).toHaveLength(1)
  })

  it("does not let a long outage or a rejected batch doom the changes after it", async () => {
    let failure: () => Error = offlineError
    const execute = vi.fn(async () => {
      throw failure()
    })
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(counters.a).toBe(1)

    // The server comes back and rejects that change: only it is rolled back.
    failure = () => new FollowAPIError("nope", 422)
    transactionQueue.resume()
    await vi.advanceTimersByTimeAsync(0)
    expect(counters.a).toBe(0)
    expect(outboxRows).toHaveLength(0)

    // The next change made during the next outage is kept, not rolled back after one try.
    failure = offlineError
    await transactionQueue.enqueue(kind, { key: "b", delta: 1 })
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(counters.b).toBe(1)
    expect(outboxRows).toHaveLength(1)
  })

  it("lets new changes wait for the scheduled retry and sends them in one batch", async () => {
    let reachable = false
    const execute = vi.fn(async () => {
      if (!reachable) throw offlineError()
    })
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100)
    expect(execute).toHaveBeenCalledTimes(1)

    // Marks made while the retry is pending do not each spend a request.
    await transactionQueue.enqueue(kind, { key: "a", delta: 2 })
    await vi.advanceTimersByTimeAsync(500)
    await transactionQueue.enqueue(kind, { key: "a", delta: 3 })
    await vi.advanceTimersByTimeAsync(300)
    expect(execute).toHaveBeenCalledTimes(1)

    reachable = true
    await vi.advanceTimersByTimeAsync(200)
    await transactionQueue.whenIdle()
    expect(execute).toHaveBeenCalledTimes(2)
    expect(execute).toHaveBeenLastCalledWith([
      { key: "a", delta: 1 },
      { key: "a", delta: 2 },
      { key: "a", delta: 3 },
    ])
    expect(persisted.a).toBe(6)
  })

  it("starts the back-off over when the app or the network comes back", async () => {
    const execute = vi.fn(async () => {
      throw offlineError()
    })
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    // 100 ms flush, then retries after 1, 2, 4, 8 and 16 s: the next one is 32 s away.
    await vi.advanceTimersByTimeAsync(100 + 1000 + 2000 + 4000 + 8000 + 16_000)
    expect(execute).toHaveBeenCalledTimes(6)

    transactionQueue.resume()
    await vi.advanceTimersByTimeAsync(0)
    expect(execute).toHaveBeenCalledTimes(7)
    await vi.advanceTimersByTimeAsync(1000)
    expect(execute).toHaveBeenCalledTimes(8)
  })

  it("retries at once when the window gets the focus back", async () => {
    let reachable = false
    const execute = vi.fn(async () => {
      if (!reachable) throw offlineError()
    })
    const kind = createCounterKind({ execute })

    await transactionQueue.restore()
    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100)
    expect(execute).toHaveBeenCalledTimes(1)

    reachable = true
    windowEvents.dispatchEvent(new Event("focus"))
    await transactionQueue.whenIdle()
    expect(execute).toHaveBeenCalledTimes(2)
    expect(persisted.a).toBe(1)
  })
})

describe("transactionQueue and the account of the session", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    transactionQueue.clearInSession()
    launch()
    outboxRows.length = 0
    for (const key of Object.keys(counters)) delete counters[key]
    for (const key of Object.keys(persisted)) delete persisted[key]
    vi.clearAllMocks()
  })

  afterEach(() => {
    transactionQueue.clearInSession()
    launch()
    vi.useRealTimers()
  })

  it("records which account made a change, in memory and in the outbox", async () => {
    signInAs("user-a")
    const kind = createCounterKind({ execute: vi.fn(() => new Promise<void>(() => {})) })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })

    expect(getLocalDataOwner()).toBe("user-a")
    expect(outboxRows).toEqual([expect.objectContaining({ userId: "user-a" })])
  })

  it("never sends a change with another account's session, and sends it once its own is back", async () => {
    signInAs("user-a")
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new FollowAPIError("session revoked", 401))
      .mockResolvedValue(undefined)
    const kind = createCounterKind({ execute })

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100)
    expect(execute).toHaveBeenCalledTimes(1)

    // The dead session is replaced by a sign-in to another account.
    invalidateSessionUser()
    signInAs("user-b")
    transactionQueue.resume()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(counters.a).toBe(1)
    expect(outboxRows).toHaveLength(1)

    // Signing in as the account that made the change sends it at once.
    invalidateSessionUser()
    signInAs("user-a")
    await transactionQueue.whenIdle()

    expect(execute).toHaveBeenCalledTimes(2)
    expect(persisted.a).toBe(1)
    expect(outboxRows).toHaveLength(0)
  })

  it("drops a restored change of an account whose data is not here, without sending it", async () => {
    signInAs("user-a")
    const kind = createCounterKind()
    transactionQueue.register(kind)
    outboxRows.push(
      {
        id: "t1",
        kind: kind.kind,
        payload: { key: "b", delta: 1 },
        createdAt: new Date(1),
        userId: "user-b",
      },
      {
        id: "t2",
        kind: kind.kind,
        payload: { key: "a", delta: 1 },
        createdAt: new Date(2),
        userId: "user-a",
      },
    )

    await transactionQueue.restore()
    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(kind.execute).toHaveBeenCalledTimes(1)
    expect(kind.execute).toHaveBeenCalledWith([{ key: "a", delta: 1 }])
    expect(outboxRows).toHaveLength(0)
  })

  it("asks the session endpoint first after a launch, then sends", async () => {
    let answer: (userId: string) => void = () => {}
    const verify = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          answer = (userId) => {
            signInAs(userId)
            resolve()
          }
        }),
    )
    registerSessionVerifier(verify)
    const kind = createCounterKind()
    transactionQueue.register(kind)
    outboxRows.push({
      id: "t1",
      kind: kind.kind,
      payload: { key: "a", delta: 1 },
      createdAt: new Date(1),
      userId: "user-a",
    })

    await transactionQueue.restore()
    await vi.advanceTimersByTimeAsync(100)
    expect(verify).toHaveBeenCalledTimes(1)
    expect(kind.execute).not.toHaveBeenCalled()

    answer("user-a")
    await transactionQueue.whenIdle()
    expect(kind.execute).toHaveBeenCalledTimes(1)
  })

  it("waits with back-off while the session endpoint cannot be reached either", async () => {
    let reachable = false
    const verify = vi.fn(async () => {
      if (!reachable) throw new Error("fetch failed: offline")
      signInAs("user-a")
    })
    registerSessionVerifier(verify)
    // The local data belongs to user-a from an earlier session.
    signInAs("user-a")
    invalidateSessionUser()
    const kind = createCounterKind()

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(100 + 1000 + 2000)
    expect(verify).toHaveBeenCalledTimes(3)
    expect(kind.execute).not.toHaveBeenCalled()
    expect(counters.a).toBe(1)

    reachable = true
    transactionQueue.resume()
    await transactionQueue.whenIdle()
    expect(kind.execute).toHaveBeenCalledTimes(1)
  })

  it("keeps a change made while signed out for the account that owns the local data", async () => {
    signInAs("user-a")
    signInAs(null)
    const kind = createCounterKind()

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(kind.execute).not.toHaveBeenCalled()
    expect(outboxRows).toEqual([expect.objectContaining({ userId: "user-a" })])
    // It waits for the sign-in without polling.
    expect(vi.getTimerCount()).toBe(0)

    invalidateSessionUser()
    signInAs("user-a")
    await transactionQueue.whenIdle()
    expect(kind.execute).toHaveBeenCalledTimes(1)
  })
})

describe("classifyTransactionError", () => {
  it("retries what got no answer or a 'not now', fails on rejections, pauses on auth errors", () => {
    expect(classifyTransactionError(new TypeError("Failed to fetch"))).toBe("retry")
    expect(classifyTransactionError(new Error("fetch failed: offline"))).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 500))).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 503))).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 408))).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 425))).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 429))).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 400))).toBe("fail")
    expect(classifyTransactionError(new FollowAPIError("x", 403))).toBe("fail")
    expect(classifyTransactionError(new FollowAPIError("x", 404))).toBe("fail")
    expect(classifyTransactionError(new FollowAPIError("x", 422))).toBe("fail")
    expect(classifyTransactionError(new FollowAPIError("x", 401))).toBe("pause")
  })
})
