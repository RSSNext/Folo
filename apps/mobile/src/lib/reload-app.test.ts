import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { abortInFlightRequests, getInFlightRequestCount, trackFetch } from "./network-activity"
import { reloadApp } from "./reload-app"

const mocks = vi.hoisted(() => ({
  reloadAppAsync: vi.fn(async () => {}),
  cancelQueries: vi.fn(async () => {}),
}))

vi.mock("expo", () => ({ reloadAppAsync: mocks.reloadAppAsync }))
vi.mock("./query-client", () => ({ queryClient: { cancelQueries: mocks.cancelQueries } }))

beforeEach(() => {
  vi.useFakeTimers()
  mocks.reloadAppAsync.mockClear()
  mocks.cancelQueries.mockClear()
})

afterEach(() => {
  abortInFlightRequests()
  vi.useRealTimers()
})

describe("reloadApp", () => {
  it("cancels queries, aborts in-flight requests and reloads once they settled", async () => {
    let aborted = false
    const tracked = trackFetch(
      (_input: string, init?: { signal?: AbortSignal | null }) =>
        new Promise<string>((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            aborted = true
            reject(new Error("aborted"))
          })
        }),
    )
    const pending = tracked("https://example.test/pending").catch(() => "aborted")

    const reload = reloadApp("test")
    await vi.advanceTimersByTimeAsync(0)
    expect(mocks.cancelQueries).toHaveBeenCalledTimes(1)
    expect(aborted).toBe(true)
    await expect(pending).resolves.toBe("aborted")
    expect(mocks.reloadAppAsync).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)
    await reload
    expect(mocks.reloadAppAsync).toHaveBeenCalledWith("test")
    expect(getInFlightRequestCount()).toBe(0)
  })

  it("still reloads after the drain timeout when a request ignores the abort", async () => {
    let finish!: (value: string) => void
    const tracked = trackFetch(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve
        }),
    )
    const stubborn = tracked("https://example.test/stubborn")

    const reload = reloadApp("stuck")
    await vi.advanceTimersByTimeAsync(3_000)
    expect(mocks.reloadAppAsync).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)
    await reload
    expect(mocks.reloadAppAsync).toHaveBeenCalledWith("stuck")

    finish("late")
    await expect(stubborn).resolves.toBe("late")
    expect(getInFlightRequestCount()).toBe(0)
  })

  it("reloads right away when the network is already idle", async () => {
    expect(getInFlightRequestCount()).toBe(0)
    const reload = reloadApp("idle")
    await vi.advanceTimersByTimeAsync(150)
    await reload
    expect(mocks.reloadAppAsync).toHaveBeenCalledWith("idle")
  })
})
