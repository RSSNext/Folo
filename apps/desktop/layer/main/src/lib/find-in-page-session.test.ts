import { afterEach, describe, expect, it, vi } from "vitest"

import type { FindRequest, FindResult } from "./find-in-page-session"
import { FindInPageSession } from "./find-in-page-session"

type SentRequest = FindRequest & { findNext: boolean; signal: AbortSignal }

const createSession = (options: { replyTimeout?: number } = {}) => {
  const sent: SentRequest[] = []
  const replies: Array<(result: FindResult | null) => void> = []
  const find = vi.fn((request: FindRequest & { findNext: boolean }, signal: AbortSignal) => {
    sent.push({ ...request, signal })
    return new Promise<FindResult | null>((resolve) => {
      replies.push(resolve)
    })
  })
  const stop = vi.fn()
  const onResult = vi.fn()
  const session = new FindInPageSession({
    find,
    stop,
    onResult,
    replyTimeout: options.replyTimeout,
  })

  const reply = async (index: number, result: FindResult | null) => {
    replies[index]?.(result)
    // Let the session handle the reply and send the next request
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return { session, sent, find, stop, onResult, reply }
}

const result = (activeMatchOrdinal: number, matches = 4): FindResult => ({
  activeMatchOrdinal,
  matches,
})

describe("FindInPageSession", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts a find session for new text and moves through it with follow-up requests", async () => {
    const { session, sent, reply, onResult } = createSession()

    session.find({ text: "timeline", direction: "forward" })
    await reply(0, result(1))
    session.find({ text: "timeline", direction: "forward" })
    await reply(1, result(2))
    session.find({ text: "timeline", direction: "backward" })
    await reply(2, result(1))
    session.find({ text: "time", direction: "forward" })

    expect(sent.map(({ text, direction, findNext }) => [text, direction, findNext])).toEqual([
      ["timeline", "forward", true],
      ["timeline", "forward", false],
      ["timeline", "backward", false],
      ["time", "forward", true],
    ])
    expect(onResult.mock.calls.map(([value]) => value.activeMatchOrdinal)).toEqual([1, 2, 1])
  })

  it("sends one request at a time and keeps every step asked for meanwhile", async () => {
    const { session, sent, reply, onResult } = createSession()

    session.find({ text: "timeline", direction: "forward" })
    session.find({ text: "timeline", direction: "forward" })
    session.find({ text: "timeline", direction: "forward" })
    expect(sent).toHaveLength(1)

    await reply(0, result(1))
    expect(sent).toHaveLength(2)
    await reply(1, result(2))
    expect(sent).toHaveLength(3)
    await reply(2, result(3))

    expect(sent.map(({ findNext }) => findNext)).toEqual([true, false, false])
    expect(onResult.mock.calls.map(([value]) => value.activeMatchOrdinal)).toEqual([1, 2, 3])
  })

  it("drops the steps queued for a text that was changed meanwhile", async () => {
    const { session, sent, reply } = createSession()

    session.find({ text: "time", direction: "forward" })
    session.find({ text: "time", direction: "forward" })
    session.find({ text: "timeline", direction: "forward" })
    await reply(0, result(1))
    await reply(1, result(1))

    expect(sent.map(({ text, findNext }) => [text, findNext])).toEqual([
      ["time", true],
      ["timeline", true],
    ])
  })

  it("abandons a pending request when cleared and starts over afterwards", async () => {
    const { session, sent, reply, stop, onResult } = createSession()

    session.find({ text: "timeline", direction: "forward" })
    session.find({ text: "timeline", direction: "forward" })
    session.clear()

    expect(stop).toHaveBeenCalledTimes(1)
    expect(sent[0]?.signal.aborted).toBe(true)

    await reply(0, result(1))
    expect(onResult).not.toHaveBeenCalled()
    expect(sent).toHaveLength(1)

    session.find({ text: "timeline", direction: "forward" })
    expect(sent.at(-1)?.findNext).toBe(true)
  })

  it("moves on when the page never answers", async () => {
    vi.useFakeTimers()
    const { session, sent } = createSession({ replyTimeout: 1000 })

    session.find({ text: "timeline", direction: "forward" })
    session.find({ text: "timeline", direction: "backward" })
    expect(sent).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1000)

    expect(sent[0]?.signal.aborted).toBe(true)
    expect(sent).toHaveLength(2)
    expect(sent[1]).toMatchObject({ direction: "backward", findNext: false })
  })

  it("treats a failed request like an unanswered one", async () => {
    const onResult = vi.fn()
    const find = vi
      .fn()
      .mockRejectedValueOnce(new Error("The window is gone"))
      .mockResolvedValueOnce(result(2))
    const session = new FindInPageSession({ find, stop: vi.fn(), onResult })

    session.find({ text: "timeline", direction: "forward" })
    session.find({ text: "timeline", direction: "forward" })

    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(result(2))
    })
    expect(find).toHaveBeenCalledTimes(2)
  })
})
