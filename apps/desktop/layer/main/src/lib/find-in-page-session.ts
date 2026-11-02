export type FindDirection = "forward" | "backward"

export interface FindRequest {
  text: string
  direction: FindDirection
}

export interface FindResult {
  activeMatchOrdinal: number
  matches: number
}

interface FindInPageSessionOptions {
  /**
   * Sends one request to the page. `findNext` starts a new find session. The signal aborts when
   * the request is abandoned, e.g. because it was never answered.
   */
  find: (
    request: FindRequest & { findNext: boolean },
    signal: AbortSignal,
  ) => Promise<FindResult | null | undefined>
  /** Stops finding in the page and clears the highlights */
  stop: () => void
  onResult: (result: FindResult) => void
  /** Chromium may never answer a request, e.g. when the page reloads meanwhile */
  replyTimeout?: number
}

const DEFAULT_REPLY_TIMEOUT = 3000

/**
 * Sends the find bar's requests to the page one at a time. Chromium answers overlapping
 * requests out of order or not at all, so requests made meanwhile wait their turn, and a new
 * text drops the steps queued for the previous one.
 */
export class FindInPageSession {
  private pendingRequest: AbortController | null = null
  private queue: FindRequest[] = []
  /**
   * Text of the current find session. Follow-up requests for it move to the next or previous
   * match. A new session would start over from the current match and report it again.
   */
  private sessionText = ""

  constructor(private readonly options: FindInPageSessionOptions) {}

  find(request: FindRequest) {
    if (this.pendingRequest) {
      this.queue = [...this.queue.filter((queued) => queued.text === request.text), request]
      return
    }
    void this.send(request)
  }

  /** Stops the search in the page. Once stopped, Chromium doesn't answer a pending request. */
  clear() {
    this.dispose()
    this.options.stop()
  }

  /** Forgets pending and queued requests */
  dispose() {
    this.pendingRequest?.abort()
    this.pendingRequest = null
    this.queue = []
    this.sessionText = ""
  }

  private async send(request: FindRequest) {
    const pendingRequest = new AbortController()
    this.pendingRequest = pendingRequest

    const findNext = request.text !== this.sessionText
    this.sessionText = request.text
    const reply = new Promise<FindResult | null | undefined>((resolve) => {
      resolve(this.options.find({ ...request, findNext }, pendingRequest.signal))
    }).catch(() => null)
    const timer = setTimeout(
      () => pendingRequest.abort(),
      this.options.replyTimeout ?? DEFAULT_REPLY_TIMEOUT,
    )
    const result = await Promise.race([
      reply,
      new Promise<null>((resolve) => {
        pendingRequest.signal.addEventListener("abort", () => resolve(null), { once: true })
      }),
    ])
    clearTimeout(timer)
    // Cleared meanwhile
    if (this.pendingRequest !== pendingRequest) return
    this.pendingRequest = null

    if (result) this.options.onResult(result)
    const next = this.queue.shift()
    if (next) void this.send(next)
  }
}
