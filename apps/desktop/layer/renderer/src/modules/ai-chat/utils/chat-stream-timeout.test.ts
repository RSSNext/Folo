import type { UIMessageChunk } from "ai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CHAT_STREAM_IDLE_TIMEOUT,
  CHAT_STREAM_WAITING_TIMEOUT,
  createChatStreamTimeout,
} from "./chat-stream-timeout"
import { withInactivityTimeout } from "./stream-timeout"

const MINUTE = 60_000
// The production server's own limits for a reply
const SERVER_FIRST_OUTPUT_TIMEOUT = 5 * MINUTE
const SERVER_IDLE_TIMEOUT = 90_000
const SERVER_TOTAL_TIMEOUT = 20 * MINUTE

const chunk = (type: string) => ({ type }) as UIMessageChunk

describe("createChatStreamTimeout", () => {
  it("outwaits the server in every phase", () => {
    expect(CHAT_STREAM_WAITING_TIMEOUT).toBeGreaterThan(SERVER_TOTAL_TIMEOUT)
    expect(CHAT_STREAM_WAITING_TIMEOUT).toBeGreaterThan(SERVER_FIRST_OUTPUT_TIMEOUT)
    expect(CHAT_STREAM_IDLE_TIMEOUT).toBeGreaterThan(SERVER_IDLE_TIMEOUT)
  })

  it("waits for the model until it answers, and while a tool runs", () => {
    const next = createChatStreamTimeout()

    expect(next(undefined)).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("start"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("start-step"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("text-start"))).toBe(CHAT_STREAM_IDLE_TIMEOUT)
    expect(next(chunk("text-delta"))).toBe(CHAT_STREAM_IDLE_TIMEOUT)
    expect(next(chunk("tool-input-start"))).toBe(CHAT_STREAM_IDLE_TIMEOUT)
    expect(next(chunk("tool-input-available"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("tool-output-available"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("finish-step"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("reasoning-delta"))).toBe(CHAT_STREAM_IDLE_TIMEOUT)
  })

  it("keeps the phase for chunks that are neither", () => {
    const next = createChatStreamTimeout()

    expect(next(chunk("message-metadata"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    expect(next(chunk("data-generated-title"))).toBe(CHAT_STREAM_WAITING_TIMEOUT)
    next(chunk("text-delta"))
    expect(next(chunk("message-metadata"))).toBe(CHAT_STREAM_IDLE_TIMEOUT)
  })
})

describe("chat reply stream timeout", () => {
  let source!: ReadableStreamDefaultController<UIMessageChunk>
  let reader!: ReadableStreamDefaultReader<UIMessageChunk>

  beforeEach(() => {
    vi.useFakeTimers()
    reader = withInactivityTimeout(
      new ReadableStream<UIMessageChunk>({
        start(controller) {
          source = controller
        },
      }),
      createChatStreamTimeout(),
      () => new Error("client timeout"),
    ).getReader()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const send = async (type: string) => {
    source.enqueue(chunk(type))
    await expect(reader.read()).resolves.toEqual({ done: false, value: chunk(type) })
  }

  it("lets the server end a reply whose model never answers", async () => {
    await send("start")
    await send("start-step")

    await vi.advanceTimersByTimeAsync(SERVER_FIRST_OUTPUT_TIMEOUT)
    source.enqueue({ type: "error", errorText: "The AI model stopped responding" })
    source.close()

    await expect(reader.read()).resolves.toEqual({
      done: false,
      value: { type: "error", errorText: "The AI model stopped responding" },
    })
    await expect(reader.read()).resolves.toEqual({ done: true, value: undefined })
    expect(vi.getTimerCount()).toBe(0)
  })

  it("keeps waiting while the model thinks or a tool runs for many minutes", async () => {
    await send("start")
    await send("start-step")
    await vi.advanceTimersByTimeAsync(SERVER_TOTAL_TIMEOUT - MINUTE)
    await send("tool-input-start")
    await send("tool-input-available")
    await vi.advanceTimersByTimeAsync(SERVER_TOTAL_TIMEOUT - MINUTE)
    await send("tool-output-available")
    await send("text-delta")
  })

  it("ends a reply whose answer stops arriving mid-stream", async () => {
    await send("start")
    await send("text-start")
    await send("text-delta")

    const next = expect(reader.read()).rejects.toThrow("client timeout")
    await vi.advanceTimersByTimeAsync(SERVER_IDLE_TIMEOUT)
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(CHAT_STREAM_IDLE_TIMEOUT - SERVER_IDLE_TIMEOUT)
    await next
  })

  it("ends a reply whose connection died before the model answered", async () => {
    await send("start")

    const next = expect(reader.read()).rejects.toThrow("client timeout")
    await vi.advanceTimersByTimeAsync(CHAT_STREAM_WAITING_TIMEOUT)
    await next
  })
})
