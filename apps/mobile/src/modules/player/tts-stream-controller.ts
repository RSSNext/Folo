import type {
  WebView as WebViewType,
  WebViewMessageEvent,
  WebViewProps,
} from "react-native-webview"

export type TtsPlaybackStatus = "idle" | "loading" | "paused" | "playing"

export interface TtsStreamPlaybackState {
  artwork?: string | null
  artist?: string | null
  entryId: string | null
  status: TtsPlaybackStatus
  title?: string | null
}

type TtsBridgeCommand =
  | {
      entryId: string
      requestId: string
      text: string
      type: "play"
      voice?: string
    }
  | {
      entryId: string
      type: "toggle"
    }
  | {
      type: "stop"
    }

type TtsBridgeEvent =
  | { type: "ready" }
  | {
      entryId: string
      requestId: string
      type: "ended" | "paused" | "playing" | "progress" | "started"
    }
  | { entryId: string; message: string; requestId: string; type: "error" }

/**
 * The TTS service takes several seconds to send the first bytes of a long text and can pause for
 * a few seconds between chunks, so a start only times out when the WebView reports no download
 * progress for this long.
 */
const START_STALL_TIMEOUT_MS = 15_000

/** A newer play request or a stop replaced the stream before it started. */
export class TtsStreamInterruptedError extends Error {
  constructor() {
    super("TTS interrupted")
    this.name = "TtsStreamInterruptedError"
  }
}

class TtsStreamController {
  private listeners = new Set<() => void>()

  private playbackState: TtsStreamPlaybackState = {
    artwork: null,
    artist: null,
    entryId: null,
    status: "idle",
    title: null,
  }

  // The request the playback state belongs to. Events of any other request are stale.
  private activeRequestId: string | null = null

  private pendingStart: {
    reject: (reason?: unknown) => void
    requestId: string
    resolve: () => void
    timeoutId: ReturnType<typeof setTimeout>
  } | null = null

  private queuedCommands: string[] = []
  private ready = false
  private readyWaiters = new Set<() => void>()
  private requestCount = 0
  private webView: WebViewType<WebViewProps> | null = null

  attachWebView = (webView: WebViewType<WebViewProps> | null) => {
    this.webView = webView
    if (!webView) {
      this.ready = false
      // The stream went away with the WebView, e.g. after the system killed its content process
      if (this.activeRequestId) {
        this.endActiveRequest(new Error("TTS streaming player was closed"))
      }
    }
  }

  getState = () => this.playbackState

  canToggleEntry = (entryId: string) =>
    this.playbackState.entryId === entryId && this.playbackState.status !== "loading"

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  handleMessage = (event: WebViewMessageEvent) => {
    let payload: TtsBridgeEvent
    try {
      payload = JSON.parse(event.nativeEvent.data) as TtsBridgeEvent
    } catch {
      return
    }

    // A late event of a request that was replaced or stopped
    if (payload.type !== "ready" && payload.requestId !== this.activeRequestId) {
      return
    }

    switch (payload.type) {
      case "ready": {
        this.ready = true
        for (const resolve of this.readyWaiters) {
          resolve()
        }
        this.readyWaiters.clear()
        this.flushQueuedCommands()
        return
      }
      case "progress": {
        this.restartStartTimeout()
        return
      }
      case "started": {
        this.setPlaybackState({
          status: "playing",
        })
        this.resolvePendingStart()
        return
      }
      case "playing":
      case "paused": {
        this.setPlaybackState({
          status: payload.type,
        })
        return
      }
      case "ended": {
        this.endActiveRequest(new Error("TTS stream ended before playback started"))
        return
      }
      case "error": {
        this.endActiveRequest(new Error(payload.message))
      }
    }
  }

  play = async ({
    artwork,
    artist,
    entryId,
    text,
    title,
    voice,
  }: {
    artwork?: string | null
    artist?: string | null
    entryId: string
    text: string
    title?: string | null
    voice?: string
  }) => {
    await this.waitUntilReady()

    this.requestCount += 1
    const requestId = `${entryId}-${Date.now()}-${this.requestCount}`

    this.rejectPendingStart(new TtsStreamInterruptedError())
    this.activeRequestId = requestId
    this.setPlaybackState({
      artwork,
      artist,
      entryId,
      status: "loading",
      title,
    })

    await new Promise<void>((resolve, reject) => {
      this.pendingStart = {
        reject,
        requestId,
        resolve,
        timeoutId: this.scheduleStartTimeout(requestId),
      }

      this.sendCommand({
        entryId,
        requestId,
        text,
        type: "play",
        voice,
      })
    })
  }

  toggle = async (entryId: string) => {
    await this.waitUntilReady()
    this.sendCommand({
      entryId,
      type: "toggle",
    })
  }

  stop = async () => {
    this.rejectPendingStart(new TtsStreamInterruptedError())
    this.sendCommand({
      type: "stop",
    })
    this.activeRequestId = null
    this.resetPlaybackState()
  }

  private flushQueuedCommands = () => {
    if (!this.webView || !this.ready) {
      return
    }

    for (const command of this.queuedCommands) {
      this.webView.postMessage(command)
    }
    this.queuedCommands = []
  }

  private scheduleStartTimeout = (requestId: string) =>
    setTimeout(() => {
      if (this.pendingStart?.requestId !== requestId) {
        return
      }

      // Otherwise the WebView keeps downloading and starts playing audio the app no longer tracks
      this.sendCommand({
        type: "stop",
      })
      this.endActiveRequest(new Error("TTS streaming did not start in time"))
    }, START_STALL_TIMEOUT_MS)

  private restartStartTimeout = () => {
    if (!this.pendingStart) {
      return
    }

    clearTimeout(this.pendingStart.timeoutId)
    this.pendingStart.timeoutId = this.scheduleStartTimeout(this.pendingStart.requestId)
  }

  private resolvePendingStart = () => {
    if (!this.pendingStart) {
      return
    }

    clearTimeout(this.pendingStart.timeoutId)
    this.pendingStart.resolve()
    this.pendingStart = null
  }

  private rejectPendingStart = (error: Error) => {
    if (!this.pendingStart) {
      return
    }

    clearTimeout(this.pendingStart.timeoutId)
    this.pendingStart.reject(error)
    this.pendingStart = null
  }

  // Rejects the start when the request ends before playing, e.g. the stream had no playable audio
  private endActiveRequest = (error: Error) => {
    this.rejectPendingStart(error)
    this.activeRequestId = null
    this.resetPlaybackState()
  }

  private notify = () => {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private resetPlaybackState = () => {
    this.playbackState = {
      artwork: null,
      artist: null,
      entryId: null,
      status: "idle",
      title: null,
    }
    this.notify()
  }

  private setPlaybackState = (patch: Partial<TtsStreamPlaybackState>) => {
    this.playbackState = {
      ...this.playbackState,
      ...patch,
    }
    this.notify()
  }

  private sendCommand = (command: TtsBridgeCommand) => {
    const serialized = JSON.stringify(command)

    if (!this.webView || !this.ready) {
      this.queuedCommands.push(serialized)
      return
    }

    this.webView.postMessage(serialized)
  }

  private waitUntilReady = () => {
    if (this.ready && this.webView) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.readyWaiters.delete(handleReady)
        reject(new Error("TTS streaming player is not ready"))
      }, 5_000)

      const handleReady = () => {
        clearTimeout(timeoutId)
        resolve()
      }

      this.readyWaiters.add(handleReady)
    })
  }
}

export const ttsStreamController = new TtsStreamController()
