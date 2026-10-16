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
})
