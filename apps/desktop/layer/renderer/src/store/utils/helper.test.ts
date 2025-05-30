import { fail } from "node:assert"

import { describe, expect, it, vi } from "vitest"

import { createTransaction } from "./helper"

describe("createTransaction", () => {
  it("should execute all steps in correct order", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }

    const transaction = createTransaction(snapshot)
      .optimistic(async () => {
        executionOrder.push("optimistic")
      })
      .execute(async () => {
        executionOrder.push("execute")
      })
      .persist(async () => {
        executionOrder.push("persist")
      })

    await transaction.run()

    expect(executionOrder).toEqual(["optimistic", "execute", "persist"])
  })

  it("should handle rollback when execution fails", async () => {
    const snapshot = { value: 1 }
    const rollbackMock = vi.fn()
    const error = new Error("Execution failed")
    const persistMock = vi.fn()

    const transaction = createTransaction(snapshot)
      .rollback(rollbackMock)
      .execute(async () => {
        throw error
      })
      .persist(persistMock)

    await expect(transaction.run()).rejects.toThrow(error)
    expect(rollbackMock).toHaveBeenCalledWith(snapshot, {})
    expect(persistMock).not.toHaveBeenCalled()
  })

  it("should continue if optimistic update fails", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }
    const rollbackMock = vi.fn()

    const transaction = createTransaction(snapshot)
      .rollback(rollbackMock)
      .optimistic(async () => {
        throw new Error("Optimistic update failed")
      })
      .execute(async () => {
        executionOrder.push("execute")
      })
      .persist(async () => {
        executionOrder.push("persist")
      })

    await transaction.run()

    expect(executionOrder).toEqual(["execute", "persist"])
    expect(rollbackMock).not.toHaveBeenCalled()
  })

  it("should maintain method chaining", () => {
    const snapshot = { value: 1 }
    const transaction = createTransaction(snapshot)

    expect(transaction.optimistic(() => Promise.resolve())).toBe(transaction)
    expect(transaction.execute(() => Promise.resolve())).toBe(transaction)
    expect(transaction.rollback(() => Promise.resolve())).toBe(transaction)
    expect(transaction.persist(() => Promise.resolve())).toBe(transaction)
  })

  it("should pass context to all functions", async () => {
    const snapshot = { value: 1 }
    const ctx = { someContext: "test" }
    const optimisticMock = vi.fn()
    const executeMock = vi.fn()
    const persistMock = vi.fn()

    const transaction = createTransaction(snapshot, ctx)
      .optimistic(optimisticMock)
      .execute(executeMock)
      .persist(persistMock)

    await transaction.run()

    expect(optimisticMock).toHaveBeenCalledWith(snapshot, ctx)
    expect(executeMock).toHaveBeenCalledWith(snapshot, ctx)
    expect(persistMock).toHaveBeenCalledWith(snapshot, ctx)
  })

  it("should pass context to rollback function when execution fails", async () => {
    const snapshot = { value: 1 }
    const ctx = { someContext: "test" }
    const rollbackMock = vi.fn()
    const error = new Error("Execution failed")

    const transaction = createTransaction(snapshot, ctx)
      .rollback(rollbackMock)
      .execute(async () => {
        throw error
      })

    await expect(transaction.run()).rejects.toThrow(error)
    expect(rollbackMock).toHaveBeenCalledWith(snapshot, ctx)
  })

  it("should allow modifying context in optimistic phase for later consumption", async () => {
    const snapshot = { value: 1 }
    const ctx = { someValue: "initial" }
    const executionOrder: string[] = []

    const transaction = createTransaction(snapshot, ctx)
      .optimistic(async (_, context: any) => {
        context.someValue = "modified"
        executionOrder.push(`optimistic: ${context.someValue}`)
      })
      .execute(async (_, context: any) => {
        executionOrder.push(`execute: ${context.someValue}`)
      })
      .persist(async (_, context: any) => {
        executionOrder.push(`persist: ${context.someValue}`)
      })

    await transaction.run()

    expect(executionOrder).toEqual([
      "optimistic: modified",
      "execute: modified",
      "persist: modified",
    ])
    expect(ctx.someValue).toBe("modified")
  })

  it("should propagate the exact same error instance from execute to run", async () => {
    const snapshot = { value: 1 }
    const specificError = new Error("Specific error message")

    const transaction = createTransaction(snapshot).execute(async () => {
      throw specificError
    })

    try {
      await transaction.run()
      fail("Expected an error to be thrown")
    } catch (error) {
      expect(error).toBe(specificError)
    }
  })

  it("should support synchronous functions in optimistic phase", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }

    const transaction = createTransaction(snapshot)
      .optimistic(() => {
        executionOrder.push("optimistic")
      })
      .execute(async () => {
        executionOrder.push("execute")
      })

    await transaction.run()
    expect(executionOrder).toEqual(["optimistic", "execute"])
  })

  it("should support synchronous functions in execute phase", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }

    const transaction = createTransaction(snapshot)
      .execute(() => {
        executionOrder.push("execute")
      })
      .persist(async () => {
        executionOrder.push("persist")
      })

    await transaction.run()
    expect(executionOrder).toEqual(["execute", "persist"])
  })

  it("should support synchronous functions in persist phase", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }

    const transaction = createTransaction(snapshot)
      .execute(async () => {
        executionOrder.push("execute")
      })
      .persist(() => {
        executionOrder.push("persist")
      })

    await transaction.run()
    expect(executionOrder).toEqual(["execute", "persist"])
  })

  it("should support synchronous functions in rollback", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }
    const error = new Error("Execution failed")

    const transaction = createTransaction(snapshot)
      .rollback(() => {
        executionOrder.push("rollback")
      })
      .execute(async () => {
        throw error
      })

    await expect(transaction.run()).rejects.toThrow(error)
    expect(executionOrder).toEqual(["rollback"])
  })

  it("should handle errors from synchronous functions", async () => {
    const snapshot = { value: 1 }
    const syncError = new Error("Sync error")
    const rollbackMock = vi.fn()

    const transaction = createTransaction(snapshot)
      .rollback(rollbackMock)
      .execute(() => {
        throw syncError
      })

    await expect(transaction.run()).rejects.toThrow(syncError)
    expect(rollbackMock).toHaveBeenCalledWith(snapshot, {})
  })

  it("should support mix of sync and async functions", async () => {
    const executionOrder: string[] = []
    const snapshot = { value: 1 }

    const transaction = createTransaction(snapshot)
      .optimistic(() => {
        executionOrder.push("sync-optimistic")
      })
      .execute(async () => {
        await Promise.resolve()
        executionOrder.push("async-execute")
      })
      .persist(() => {
        executionOrder.push("sync-persist")
      })

    await transaction.run()
    expect(executionOrder).toEqual(["sync-optimistic", "async-execute", "sync-persist"])
  })
})
