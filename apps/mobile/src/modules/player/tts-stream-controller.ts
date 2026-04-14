import type { WebView as WebViewType, WebViewMessageEvent } from "react-native-webview"

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
  | { entryId: string; requestId: string; type: "started" }
  | { entryId: string; type: "playing" | "paused" | "ended" }
  | { entryId?: string; message: string; requestId?: string; type: "error" }

const START_TIMEOUT_MS = 10_000

class TtsStreamController {
  private listeners = new Set<() => void>()

  private playbackState: TtsStreamPlaybackState = {
    artwork: null,
    artist: null,
    entryId: null,
    status: "idle",
    title: null,
  }

  private pendingStart: {
    reject: (reason?: unknown) => void
    requestId: string
    resolve: () => void
    timeoutId: ReturnType<typeof setTimeout>
  } | null = null

  private queuedCommands: string[] = []
  private ready = false
  private readyWaiters = new Set<() => void>()
  private webView: WebViewType | null = null

  attachWebView = (webView: WebViewType | null) => {
    this.webView = webView
    if (!webView) {
      this.ready = false
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
      case "started": {
        this.setPlaybackState({
          status: "playing",
        })
        this.resolvePendingStart(payload.requestId)
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
        if (this.playbackState.entryId === payload.entryId) {
          this.resetPlaybackState()
        }
        return
      }
      case "error": {
        this.rejectPendingStart(payload.requestId, new Error(payload.message))
        if (this.playbackState.entryId === payload.entryId) {
          this.resetPlaybackState()
        }
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

    const requestId = `${entryId}-${Date.now()}`

    this.rejectPendingStart(undefined, new Error("TTS interrupted"))
    this.setPlaybackState({
      artwork,
      artist,
      entryId,
      status: "loading",
      title,
    })

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingStart?.requestId === requestId) {
          this.pendingStart = null
          this.resetPlaybackState()
          reject(new Error("TTS streaming did not start in time"))
        }
      }, START_TIMEOUT_MS)

      this.pendingStart = {
        reject,
        requestId,
        resolve,
        timeoutId,
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
    this.rejectPendingStart(undefined, new Error("TTS interrupted"))
    this.sendCommand({
      type: "stop",
    })
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

  private resolvePendingStart = (requestId?: string) => {
    if (!this.pendingStart || this.pendingStart.requestId !== requestId) {
      return
    }

    clearTimeout(this.pendingStart.timeoutId)
    this.pendingStart.resolve()
    this.pendingStart = null
  }

  private rejectPendingStart = (requestId?: string, error?: Error) => {
    if (!this.pendingStart) {
      return
    }

    if (requestId && this.pendingStart.requestId !== requestId) {
      return
    }

    clearTimeout(this.pendingStart.timeoutId)
    this.pendingStart.reject(error)
    this.pendingStart = null
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
