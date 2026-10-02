// Minimal Chrome DevTools Protocol client for the isolated desktop instance
// started with `--remote-debugging-port` (see README: "Desktop captures").

interface Target {
  type: string
  url: string
  webSocketDebuggerUrl: string
}

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export interface CdpSession {
  send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>
  evaluate: <T = unknown>(expression: string) => Promise<T>
  close: () => void
}

export const cdpPort = Number(process.env.FOLO_CDP_PORT ?? 9555)

export const connectCdp = async (port = cdpPort): Promise<CdpSession> => {
  const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as Target[]
  // The app renderer is served from app://folo.is; ignore iframes and workers.
  const target = targets.find((t) => t.type === "page" && t.url.startsWith("app://"))
  if (!target) throw new Error(`No Folo page target on port ${port}`)

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve(), { once: true })
    ws.addEventListener("error", () => reject(new Error("CDP connection failed")), { once: true })
  })

  let id = 0
  const pending = new Map<number, Pending>()
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as {
      id?: number
      result?: unknown
      error?: { message: string }
    }
    if (message.id === undefined) return
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(message.error.message))
    else entry.resolve(message.result)
  })

  const send = <T>(method: string, params: Record<string, unknown> = {}) =>
    new Promise<T>((resolve, reject) => {
      const messageId = ++id
      pending.set(messageId, { resolve: resolve as (value: unknown) => void, reject })
      ws.send(JSON.stringify({ id: messageId, method, params }))
    })

  const evaluate = async <T>(expression: string) => {
    const result = await send<{
      result: { value: T }
      exceptionDetails?: { text: string; exception?: { description?: string } }
    }>("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
      )
    }
    return result.result.value
  }

  return { send, evaluate, close: () => ws.close() }
}

// Runs an authenticated Folo API request from inside the renderer, so it uses
// the demo account's session cookie without the cookie ever leaving the app.
export const apiRequest = async <T>(
  session: CdpSession,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> =>
  session.evaluate<T>(`(async () => {
    const response = await fetch(${JSON.stringify(`https://api.folo.is${path}`)}, {
      method: ${JSON.stringify(method)},
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: ${body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))},
    })
    return response.json()
  })()`)
