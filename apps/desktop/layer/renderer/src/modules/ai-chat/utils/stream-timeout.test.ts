import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { withInactivityTimeout } from "./stream-timeout"

const TIMEOUT = 1000

describe("withInactivityTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("errors a stream that stops sending data", async () => {
    let source!: ReadableStreamDefaultController<string>
    const stream = withInactivityTimeout(
      new ReadableStream<string>({
        start(controller) {
          source = controller
        },
      }),
      TIMEOUT,
      () => new Error("stalled"),
    )
    const reader = stream.getReader()

    source.enqueue("start")
    await expect(reader.read()).resolves.toEqual({ done: false, value: "start" })

    const next = expect(reader.read()).rejects.toThrow("stalled")
    await vi.advanceTimersByTimeAsync(TIMEOUT)
    await next
  })

  it("keeps a stream that sends data within the timeout", async () => {
    let source!: ReadableStreamDefaultController<string>
    const stream = withInactivityTimeout(
      new ReadableStream<string>({
        start(controller) {
          source = controller
        },
      }),
      TIMEOUT,
      () => new Error("stalled"),
    )
    const reader = stream.getReader()

    for (const chunk of ["a", "b", "c"]) {
      await vi.advanceTimersByTimeAsync(TIMEOUT - 1)
      source.enqueue(chunk)
      await expect(reader.read()).resolves.toEqual({ done: false, value: chunk })
    }
    source.close()
    await expect(reader.read()).resolves.toEqual({ done: true, value: undefined })

    // The timer is cleared once the stream ends
    await vi.advanceTimersByTimeAsync(TIMEOUT * 2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("waits as long as the chunk that just arrived calls for", async () => {
    let source!: ReadableStreamDefaultController<string>
    const seen: (string | undefined)[] = []
    const stream = withInactivityTimeout(
      new ReadableStream<string>({
        start(controller) {
          source = controller
        },
      }),
      (lastChunk) => {
        seen.push(lastChunk)
        return lastChunk === "slow" ? TIMEOUT * 10 : TIMEOUT
      },
      () => new Error("stalled"),
    )
    const reader = stream.getReader()

    source.enqueue("slow")
    await expect(reader.read()).resolves.toEqual({ done: false, value: "slow" })
    await vi.advanceTimersByTimeAsync(TIMEOUT * 10 - 1)

    source.enqueue("fast")
    await expect(reader.read()).resolves.toEqual({ done: false, value: "fast" })
    expect(seen).toEqual([undefined, "slow", "fast"])

    const next = expect(reader.read()).rejects.toThrow("stalled")
    await vi.advanceTimersByTimeAsync(TIMEOUT)
    await next
  })

  it("clears the timer when the reader cancels the stream", async () => {
    const stream = withInactivityTimeout(new ReadableStream<string>(), TIMEOUT, () => {
      throw new Error("the timer should not fire")
    })
    const reader = stream.getReader()

    await reader.cancel()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(TIMEOUT * 2)
  })
})
