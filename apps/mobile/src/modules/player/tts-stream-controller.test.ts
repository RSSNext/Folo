import type { WebView, WebViewMessageEvent, WebViewProps } from "react-native-webview"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type BridgeCommand = {
  entryId?: string
  requestId?: string
  type: "play" | "stop" | "toggle"
}

const createController = async () => {
  const { TtsStreamInterruptedError, ttsStreamController } = await import("./tts-stream-controller")
  const postMessage = vi.fn<(message: string) => void>()
  ttsStreamController.attachWebView({ postMessage } as unknown as WebView<WebViewProps>)

  const emit = (payload: Record<string, unknown>) =>
    ttsStreamController.handleMessage({
      nativeEvent: { data: JSON.stringify(payload) },
    } as WebViewMessageEvent)
  emit({ type: "ready" })

  const commands = () =>
    postMessage.mock.calls.map(([message]) => JSON.parse(message) as BridgeCommand)
  // Lets play() get past waiting for the WebView and send its command
  const lastPlayCommand = async () => {
    await vi.advanceTimersByTimeAsync(0)
    return commands().findLast((command) => command.type === "play")!
  }

  return {
    TtsStreamInterruptedError,
    commandTypes: () => commands().map((command) => command.type),
    controller: ttsStreamController,
    emit,
    lastPlayCommand,
  }
}

describe("ttsStreamController", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("stops the WebView stream when it reports no progress before playing", async () => {
    const { commandTypes, controller } = await createController()

    const playing = controller.play({ entryId: "entry-1", text: "Article text" })
    const rejection = expect(playing).rejects.toThrow("TTS streaming did not start in time")
    await vi.advanceTimersByTimeAsync(15_000)
    await rejection

    expect(commandTypes()).toEqual(["play", "stop"])
    expect(controller.getState()).toMatchObject({ entryId: null, status: "idle" })
  })

  it("keeps waiting while the download makes progress", async () => {
    const { commandTypes, controller, emit, lastPlayCommand } = await createController()

    const playing = controller.play({ entryId: "entry-1", text: "Article text" })
    const { requestId } = await lastPlayCommand()

    // Long texts take several seconds before the first bytes and decodable audio arrive
    for (let index = 0; index < 3; index += 1) {
      await vi.advanceTimersByTimeAsync(10_000)
      emit({ entryId: "entry-1", requestId, type: "progress" })
    }
    expect(controller.getState()).toMatchObject({ entryId: "entry-1", status: "loading" })

    emit({ entryId: "entry-1", requestId, type: "started" })
    await expect(playing).resolves.toBeUndefined()
    expect(commandTypes()).toEqual(["play"])
    expect(controller.getState()).toMatchObject({ entryId: "entry-1", status: "playing" })
  })

  it("times out once the progress stalls", async () => {
    const { commandTypes, controller, emit, lastPlayCommand } = await createController()

    const playing = controller.play({ entryId: "entry-1", text: "Article text" })
    const rejection = expect(playing).rejects.toThrow("TTS streaming did not start in time")
    const { requestId } = await lastPlayCommand()

    await vi.advanceTimersByTimeAsync(10_000)
    emit({ entryId: "entry-1", requestId, type: "progress" })
    await vi.advanceTimersByTimeAsync(14_999)
    expect(commandTypes()).toEqual(["play"])

    await vi.advanceTimersByTimeAsync(1)
    await rejection
    expect(commandTypes()).toEqual(["play", "stop"])
  })

  it("ignores late events of a request that a retry replaced", async () => {
    const { TtsStreamInterruptedError, controller, emit, lastPlayCommand } =
      await createController()

    const first = controller.play({ entryId: "entry-1", text: "Article text" })
    const interrupted = expect(first).rejects.toBeInstanceOf(TtsStreamInterruptedError)
    const { requestId: firstRequestId } = await lastPlayCommand()

    const second = controller.play({ entryId: "entry-1", text: "Article text" })
    const { requestId: secondRequestId } = await lastPlayCommand()
    await interrupted
    expect(secondRequestId).not.toBe(firstRequestId)

    // The replaced stream reports its aborted download after the retry started loading
    emit({ entryId: "entry-1", message: "Aborted", requestId: firstRequestId, type: "error" })
    emit({ entryId: "entry-1", requestId: firstRequestId, type: "started" })
    expect(controller.getState()).toMatchObject({ entryId: "entry-1", status: "loading" })

    emit({ entryId: "entry-1", requestId: secondRequestId, type: "started" })
    await expect(second).resolves.toBeUndefined()
    expect(controller.getState()).toMatchObject({ entryId: "entry-1", status: "playing" })
  })

  it("interrupts a pending start when stopped and ignores the stopped stream afterwards", async () => {
    const { TtsStreamInterruptedError, commandTypes, controller, emit, lastPlayCommand } =
      await createController()

    const playing = controller.play({ entryId: "entry-1", text: "Article text" })
    const interrupted = expect(playing).rejects.toBeInstanceOf(TtsStreamInterruptedError)
    const { requestId } = await lastPlayCommand()

    await controller.stop()
    await interrupted
    expect(commandTypes()).toEqual(["play", "stop"])

    emit({ entryId: "entry-1", requestId, type: "started" })
    expect(controller.getState()).toMatchObject({ entryId: null, status: "idle" })
  })

  it("fails the start with the error the WebView reports", async () => {
    const { controller, emit, lastPlayCommand } = await createController()

    const playing = controller.play({ entryId: "entry-1", text: "Article text" })
    const rejection = expect(playing).rejects.toThrow("Text is too long")
    const { requestId } = await lastPlayCommand()

    emit({ entryId: "entry-1", message: "Text is too long", requestId, type: "error" })
    await rejection
    expect(controller.getState()).toMatchObject({ entryId: null, status: "idle" })
  })

  it("ends a playing stream when its WebView goes away, e.g. after the system killed it", async () => {
    const { controller, emit, lastPlayCommand } = await createController()

    const playing = controller.play({ entryId: "entry-1", text: "Article text" })
    const { requestId } = await lastPlayCommand()
    emit({ entryId: "entry-1", requestId, type: "started" })
    await playing
    expect(controller.getState()).toMatchObject({ entryId: "entry-1", status: "playing" })

    controller.attachWebView(null)
    expect(controller.getState()).toMatchObject({ entryId: null, status: "idle" })
  })

  it("fails a waiting start when its WebView goes away, so the request can fall back", async () => {
    const { controller, lastPlayCommand } = await createController()

    const loading = controller.play({ entryId: "entry-1", text: "Article text" })
    const rejection = expect(loading).rejects.toThrow("TTS streaming player was closed")
    await lastPlayCommand()

    controller.attachWebView(null)
    await rejection
    expect(controller.getState()).toMatchObject({ entryId: null, status: "idle" })
  })
})
