import { FollowAPIError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setSyncEngineActive } from "./sync-status"
import type { TransactionKind, TransactionPersistContext } from "./transaction-queue"
import { classifyTransactionError, transactionQueue } from "./transaction-queue"

const { outboxRows, outboxInsertMock, outboxDeleteManyMock, outboxGetAllMock, outboxResetMock } =
  vi.hoisted(() => {
    const outboxRows: Array<{ id: string; kind: string; payload: unknown; createdAt: Date }> = []
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
    const unsubscribe = transactionQueue.onFailure((event) => failures.push(event.record.kind))

    await transactionQueue.enqueue(kind, { key: "a", delta: 1 })
    expect(counters.a).toBe(1)

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(counters.a).toBe(0)
    expect(persisted.a).toBeUndefined()
    expect(outboxRows).toHaveLength(0)
    expect(failures).toEqual(["test.counter"])
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

describe("classifyTransactionError", () => {
  it("retries transport and server errors, fails on client errors, pauses on auth errors", () => {
    expect(classifyTransactionError(new TypeError("Failed to fetch"), 1)).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 500), 1)).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 429), 1)).toBe("retry")
    expect(classifyTransactionError(new FollowAPIError("x", 400), 1)).toBe("fail")
    expect(classifyTransactionError(new FollowAPIError("x", 404), 1)).toBe("fail")
    expect(classifyTransactionError(new FollowAPIError("x", 401), 1)).toBe("pause")
    expect(classifyTransactionError(new TypeError("Failed to fetch"), 8)).toBe("fail")
  })
})
