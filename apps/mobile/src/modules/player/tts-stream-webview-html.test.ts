import { runInThisContext } from "node:vm"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TTS_STREAM_WEBVIEW_HTML } from "./tts-stream-webview-html"

const script = /<script>([\s\S]*)<\/script>/.exec(TTS_STREAM_WEBVIEW_HTML)![1]!

// The fake decoder turns 6 KB into one second of audio, about the 48 kbps MP3 the service sends
const BYTES_PER_SECOND = 6 * 1024
const SAMPLE_RATE = 1000

type BridgeEvent = { entryId?: string; message?: string; requestId?: string; type: string }

class FakeAudioBuffer {
  duration: number
  numberOfChannels = 1
  sampleRate = SAMPLE_RATE

  constructor(duration: number) {
    this.duration = duration
  }

  copyFromChannel() {}
  copyToChannel() {}
}

class FakeAudioContext {
  static decodeFails = false

  currentTime = 0
  destination = {}
  segmentStartTimes: number[] = []
  close = vi.fn(async () => {})
  resume = vi.fn(async () => {})
  suspend = vi.fn(async () => {})

  async decodeAudioData(data: ArrayBuffer) {
    if (FakeAudioContext.decodeFails) {
      throw new Error("Unable to decode audio data")
    }
    return new FakeAudioBuffer(data.byteLength / BYTES_PER_SECOND)
  }

  createBuffer(_numberOfChannels: number, frameCount: number, sampleRate: number) {
    return new FakeAudioBuffer(frameCount / sampleRate)
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: (startTime: number) => {
        this.segmentStartTimes.push(startTime)
      },
    }
  }
}

/** A streamed response body that hands out the chunks a test pushes. */
class FakeBody {
  private chunks: Uint8Array[] = []
  private ended = false
  private pendingRead: {
    reject: (error: Error) => void
    resolve: (result: { done: boolean; value?: Uint8Array }) => void
  } | null = null

  constructor(signal: AbortSignal) {
    signal.addEventListener("abort", () => {
      this.pendingRead?.reject(new Error("The operation was aborted."))
      this.pendingRead = null
    })
  }

  getReader() {
    return {
      cancel: async () => this.end(),
      read: () =>
        new Promise<{ done: boolean; value?: Uint8Array }>((resolve, reject) => {
          this.pendingRead = { reject, resolve }
          this.flush()
        }),
    }
  }

  push(byteLength: number) {
    this.chunks.push(new Uint8Array(byteLength))
    this.flush()
  }

  end() {
    this.ended = true
    this.flush()
  }

  private flush() {
    const read = this.pendingRead
    if (!read) {
      return
    }

    const chunk = this.chunks.shift()
    if (chunk) {
      this.pendingRead = null
      read.resolve({ done: false, value: chunk })
    } else if (this.ended) {
      this.pendingRead = null
      read.resolve({ done: true })
    }
  }
}

type FakeRequest = {
  body: FakeBody
  init: { body: string; signal: AbortSignal }
  respond: () => void
}

// Lets every pending promise of the script settle
const settle = () => new Promise((resolve) => setImmediate(resolve))

const loadWebView = () => {
  const contexts: FakeAudioContext[] = []
  const events: BridgeEvent[] = []
  const requests: FakeRequest[] = []
  let handleMessage: (event: { data: string }) => void = () => {}

  const fakeWindow = {
    AudioContext: class extends FakeAudioContext {
      constructor() {
        super()
        contexts.push(this)
      }
    },
    ReactNativeWebView: {
      postMessage: (message: string) => events.push(JSON.parse(message) as BridgeEvent),
    },
    addEventListener: (type: string, listener: typeof handleMessage) => {
      if (type === "message") {
        handleMessage = listener
      }
    },
  }
  const fakeDocument = { addEventListener: () => {} }
  const fakeFetch = (_url: string, init: FakeRequest["init"]) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new Error("The operation was aborted.")))
      const body = new FakeBody(init.signal)
      requests.push({ body, init, respond: () => resolve({ body, ok: true }) })
    })

  const run = runInThisContext(`(function (window, document, fetch) {${script}})`) as (
    window: unknown,
    document: unknown,
    fetch: unknown,
  ) => void
  run(fakeWindow, fakeDocument, fakeFetch)

  return {
    contexts,
    events,
    eventTypes: (requestId: string) =>
      events.filter((event) => event.requestId === requestId).map((event) => event.type),
    requests,
    send: async (command: Record<string, unknown>) => {
      handleMessage({ data: JSON.stringify(command) })
      await settle()
    },
  }
}

const play = (requestId: string, entryId = "entry-1") => ({
  entryId,
  requestId,
  text: "Article text",
  type: "play",
})

describe("TTS stream WebView", () => {
  let now = 0

  beforeEach(() => {
    now = 1_000_000
    vi.spyOn(Date, "now").mockImplementation(() => now)
    // Only the stall check runs on an interval; promises and the playback wait stay real
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] })
    FakeAudioContext.decodeFails = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("reports download progress until the first audio plays, then reports the end", async () => {
    const webView = loadWebView()
    expect(webView.events).toEqual([{ type: "ready" }])

    await webView.send({ ...play("request-1"), voice: "en-US-AvaMultilingualNeural" })
    const [request] = webView.requests
    expect(JSON.parse(request!.init.body)).toEqual({
      text: "Article text",
      voice: "en-US-AvaMultilingualNeural",
    })

    request!.respond()
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress"])

    // At most one progress event per second
    request!.body.push(8 * 1024)
    await settle()
    now += 1000
    request!.body.push(8 * 1024)
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress", "progress"])

    // 24 KB are enough to decode and start playing
    now += 1000
    request!.body.push(8 * 1024)
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress", "progress", "progress", "started"])

    now += 1000
    request!.body.push(16 * 1024)
    request!.body.end()
    await settle()
    // The download finished, but the queued audio is still playing
    expect(webView.eventTypes("request-1")).toEqual(["progress", "progress", "progress", "started"])

    webView.contexts[0]!.currentTime = 60
    await vi.waitFor(() => expect(webView.eventTypes("request-1")).toContain("ended"))
    expect(webView.eventTypes("request-1")).toEqual([
      "progress",
      "progress",
      "progress",
      "started",
      "ended",
    ])
    expect(webView.contexts[0]!.close).toHaveBeenCalledOnce()
  })

  it("aborts the download on stop and reports nothing for the stopped request", async () => {
    const webView = loadWebView()

    await webView.send(play("request-1"))
    await webView.send({ type: "stop" })

    const [request] = webView.requests
    expect(request!.init.signal.aborted).toBe(true)
    expect(webView.contexts[0]!.close).toHaveBeenCalledOnce()

    request!.respond()
    await settle()
    expect(webView.events).toEqual([{ type: "ready" }])
  })

  it("starts a play command for the playing entry over instead of pausing it", async () => {
    const webView = loadWebView()

    await webView.send(play("request-1"))
    webView.requests[0]!.respond()
    webView.requests[0]!.body.push(24 * 1024)
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started"])

    await webView.send(play("request-2"))
    expect(webView.requests[0]!.init.signal.aborted).toBe(true)
    expect(webView.contexts[0]!.close).toHaveBeenCalledOnce()
    expect(webView.contexts[0]!.suspend).not.toHaveBeenCalled()

    webView.requests[1]!.respond()
    webView.requests[1]!.body.push(24 * 1024)
    await settle()
    expect(webView.eventTypes("request-2")).toEqual(["progress", "started"])
    // The replaced playback never reports its aborted download
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started"])
  })

  it("schedules each decoded segment after the audio already queued", async () => {
    const webView = loadWebView()

    await webView.send(play("request-1"))
    const [request] = webView.requests
    const [context] = webView.contexts
    request!.respond()
    await settle()

    // The context clock ran for five seconds while the service prepared the first bytes
    context!.currentTime = 5
    request!.body.push(24 * 1024)
    await settle()

    context!.currentTime = 6
    request!.body.push(16 * 1024)
    await settle()

    // Four seconds of audio start at five, so the next segment waits until nine
    expect(context!.segmentStartTimes).toEqual([5, 9])
  })

  it("keeps a paused stream paused while more audio decodes", async () => {
    const webView = loadWebView()

    await webView.send(play("request-1"))
    webView.requests[0]!.respond()
    webView.requests[0]!.body.push(24 * 1024)
    await settle()

    await webView.send({ entryId: "entry-1", type: "toggle" })
    webView.requests[0]!.body.push(16 * 1024)
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started", "paused"])
    expect(webView.contexts[0]!.resume).toHaveBeenCalledOnce()

    await webView.send({ entryId: "entry-1", type: "toggle" })
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started", "paused", "playing"])
  })

  it("reports an error when the stream ends without playable audio", async () => {
    FakeAudioContext.decodeFails = true
    const webView = loadWebView()

    await webView.send(play("request-1"))
    webView.requests[0]!.respond()
    webView.requests[0]!.body.push(24 * 1024)
    webView.requests[0]!.body.end()
    await settle()

    expect(webView.events.at(-1)).toEqual({
      entryId: "entry-1",
      message: "TTS stream contained no playable audio",
      requestId: "request-1",
      type: "error",
    })
  })

  it("reports a stalled download once the queued audio ran out", async () => {
    const webView = loadWebView()

    await webView.send(play("request-1"))
    const [request] = webView.requests
    const [context] = webView.contexts
    request!.respond()
    request!.body.push(24 * 1024)
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started"])

    // No bytes for a while, but four seconds of audio are still queued
    now += 20_000
    vi.advanceTimersByTime(1000)
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started"])

    // The queued audio ran out while a slow download still sends a chunk now and then
    context!.currentTime = 5
    request!.body.push(1024)
    await settle()
    now += 10_000
    vi.advanceTimersByTime(1000)
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started"])

    // Nothing for the stall timeout while silent
    now += 5000
    vi.advanceTimersByTime(1000)
    expect(webView.events.at(-1)).toEqual({
      entryId: "entry-1",
      message: "TTS stream stalled",
      requestId: "request-1",
      type: "error",
    })
    expect(request!.init.signal.aborted).toBe(true)
    expect(context!.close).toHaveBeenCalledOnce()

    // The aborted download reports nothing more
    await settle()
    expect(webView.eventTypes("request-1")).toEqual(["progress", "started", "error"])
  })
})
