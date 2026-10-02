import { afterEach, describe, expect, it, vi } from "vitest"

import {
  abortInFlightRequests,
  getInFlightRequestCount,
  installGlobalFetchTracking,
  trackFetch,
  waitForNetworkIdle,
} from "./network-activity"

type Deferred = {
  promise: Promise<string>
  resolve: (value: string) => void
  reject: (error: unknown) => void
}

const createDeferred = (): Deferred => {
  let resolve!: Deferred["resolve"]
  let reject!: Deferred["reject"]
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** A fetch stand-in that settles only when told to, and rejects when its signal aborts. */
const createFakeFetch = () => {
  const calls: { signal: AbortSignal; deferred: Deferred }[] = []
  const fetchImpl = (_input: string, init?: { signal?: AbortSignal | null }) => {
    const deferred = createDeferred()
    const signal = init!.signal!
    if (signal.aborted) {
      deferred.reject(new Error("aborted"))
    } else {
      signal.addEventListener("abort", () => deferred.reject(new Error("aborted")), {
        once: true,
      })
    }
    calls.push({ signal, deferred })
    return deferred.promise
  }
  return { calls, fetchImpl }
}

afterEach(() => {
  abortInFlightRequests()
  vi.useRealTimers()
})

describe("trackFetch", () => {
  it("counts a request while it is in flight and settles the idle wait afterwards", async () => {
    const { calls, fetchImpl } = createFakeFetch()
    const tracked = trackFetch(fetchImpl)

    const request = tracked("https://example.test/a")
    expect(getInFlightRequestCount()).toBe(1)

    const idle = waitForNetworkIdle(1_000)
    calls[0]!.deferred.resolve("ok")
    await expect(request).resolves.toBe("ok")
    await expect(idle).resolves.toBe(true)
    expect(getInFlightRequestCount()).toBe(0)
  })

  it("forwards an abort from the caller's signal", async () => {
    const { calls, fetchImpl } = createFakeFetch()
    const tracked = trackFetch(fetchImpl)
    const outer = new AbortController()

    const request = tracked("https://example.test/b", { signal: outer.signal })
    outer.abort()

    expect(calls[0]!.signal.aborted).toBe(true)
    await expect(request).rejects.toThrow("aborted")
    expect(getInFlightRequestCount()).toBe(0)
  })

  it("hands an already aborted signal to the fetch implementation", async () => {
    const { calls, fetchImpl } = createFakeFetch()
    const tracked = trackFetch(fetchImpl)
    const outer = new AbortController()
    outer.abort()

    const request = tracked("https://example.test/c", { signal: outer.signal })
    expect(calls[0]!.signal.aborted).toBe(true)
    await expect(request).rejects.toThrow("aborted")
    expect(getInFlightRequestCount()).toBe(0)
  })
})

describe("trackFetch with a finalizable response", () => {
  const createFakeResponse = () => {
    const listeners: (() => void)[] = []
    return {
      response: {
        addListener: (_event: string, listener: () => void) => {
          listeners.push(listener)
          return {
            remove: () => {
              listeners.splice(listeners.indexOf(listener), 1)
            },
          }
        },
      },
      finalize: () => {
        for (const listener of [...listeners]) listener()
      },
      listenerCount: () => listeners.length,
    }
  }

  it("keeps the request in flight until the response reports it is finalized", async () => {
    const fake = createFakeResponse()
    const tracked = trackFetch(async (_input: string) => fake.response)

    const response = await tracked("https://example.test/body")
    expect(response).toBe(fake.response)
    expect(getInFlightRequestCount()).toBe(1)
    expect(fake.listenerCount()).toBe(1)

    const idle = waitForNetworkIdle(1_000)
    fake.finalize()
    await expect(idle).resolves.toBe(true)
    expect(getInFlightRequestCount()).toBe(0)
    expect(fake.listenerCount()).toBe(0)
  })

  it("forwards the caller's abort while the body downloads, until the response is finalized", async () => {
    const fake = createFakeResponse()
    const signals: AbortSignal[] = []
    const tracked = trackFetch(async (_input: string, init?: { signal?: AbortSignal | null }) => {
      signals.push(init!.signal!)
      return fake.response
    })

    const outer = new AbortController()
    await tracked("https://example.test/body", { signal: outer.signal })
    outer.abort()
    const abortedWhileDownloading = signals[0]!.aborted

    const later = new AbortController()
    await tracked("https://example.test/body", { signal: later.signal })
    fake.finalize()
    later.abort()

    expect(abortedWhileDownloading).toBe(true)
    expect(signals[1]!.aborted).toBe(false)
    expect(getInFlightRequestCount()).toBe(0)
  })
})

describe("installGlobalFetchTracking", () => {
  it("wraps the global fetch once and keeps tracking through it", async () => {
    const originalFetch = globalThis.fetch
    const { calls, fetchImpl } = createFakeFetch()
    globalThis.fetch = fetchImpl as unknown as typeof fetch
    try {
      installGlobalFetchTracking()
      const wrapped = globalThis.fetch
      installGlobalFetchTracking()
      expect(globalThis.fetch).toBe(wrapped)

      const request = globalThis.fetch("https://example.test/global")
      expect(getInFlightRequestCount()).toBe(1)
      calls[0]!.deferred.resolve("ok")
      await expect(request).resolves.toBe("ok")
      expect(getInFlightRequestCount()).toBe(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

describe("abortInFlightRequests", () => {
  it("aborts every tracked request so the network goes idle", async () => {
    const { fetchImpl } = createFakeFetch()
    const tracked = trackFetch(fetchImpl)
    const first = tracked("https://example.test/1")
    const second = tracked("https://example.test/2")
    expect(getInFlightRequestCount()).toBe(2)

    const idle = waitForNetworkIdle(1_000)
    abortInFlightRequests()

    await expect(first).rejects.toThrow("aborted")
    await expect(second).rejects.toThrow("aborted")
    await expect(idle).resolves.toBe(true)
    expect(getInFlightRequestCount()).toBe(0)
  })
})

describe("waitForNetworkIdle", () => {
  it("resolves immediately when nothing is in flight", async () => {
    expect(getInFlightRequestCount()).toBe(0)
    await expect(waitForNetworkIdle(1_000)).resolves.toBe(true)
  })

  it("gives up after the timeout when a request does not settle in time", async () => {
    vi.useFakeTimers()
    const deferred = createDeferred()
    const tracked = trackFetch(() => deferred.promise)
    const request = tracked("https://example.test/slow")

    const idle = waitForNetworkIdle(500)
    await vi.advanceTimersByTimeAsync(500)
    await expect(idle).resolves.toBe(false)

    deferred.resolve("late")
    await expect(request).resolves.toBe("late")
    expect(getInFlightRequestCount()).toBe(0)
  })
})
