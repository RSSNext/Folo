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
  /** Sends one request to the page. `findNext` starts a new find session. */
  find: (request: FindRequest & { findNext: boolean }) => Promise<FindResult | null | undefined>
  /** Stops finding in the page and clears the highlights */
  stop: () => void
  /**
   * Called synchronously before the first of a run of requests leaves, and after the last one
   * is answered or abandoned
   */
  onPendingChange: (pending: boolean) => void
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
  /** Changes when the search is cleared or dropped, which abandons a pending reply */
  private generation = 0
  private pending = false
  private queue: FindRequest[] = []
  /**
   * Text of the current find session. Follow-up requests for it move to the next or previous
   * match. A new session would start over from the current match and report it again.
   */
  private sessionText = ""

  constructor(private readonly options: FindInPageSessionOptions) {}

  find(request: FindRequest) {
    if (this.pending) {
      this.queue = [...this.queue.filter((queued) => queued.text === request.text), request]
      return
    }
    void this.send(request)
  }

  /** Stops the search in the page. Once stopped, Chromium doesn't answer a pending request. */
  clear() {
    this.abandon()
    this.options.stop()
  }

  /** Forgets pending and queued requests, e.g. when the find bar unmounts */
  dispose() {
    this.abandon()
  }

  private abandon() {
    this.generation++
    this.queue = []
    this.sessionText = ""
    if (this.pending) {
      this.pending = false
      this.options.onPendingChange(false)
    }
  }

  private async send(request: FindRequest) {
    const { generation } = this
    if (!this.pending) {
      this.pending = true
      this.options.onPendingChange(true)
    }

    const findNext = request.text !== this.sessionText
    this.sessionText = request.text
    const reply = new Promise<FindResult | null | undefined>((resolve) => {
      resolve(this.options.find({ ...request, findNext }))
    }).catch(() => null)
    const result = await new Promise<FindResult | null>((resolve) => {
      const timer = setTimeout(
        () => resolve(null),
        this.options.replyTimeout ?? DEFAULT_REPLY_TIMEOUT,
      )
      void reply.then((value) => {
        clearTimeout(timer)
        resolve(value ?? null)
      })
    })
    if (generation !== this.generation) return

    if (result) this.options.onResult(result)
    const next = this.queue.shift()
    if (next) {
      void this.send(next)
      return
    }
    this.pending = false
    this.options.onPendingChange(false)
  }
}
