/**
 * Tracks the `expo/fetch` requests that are in flight so the app can settle them before it
 * reloads the JS runtime (see `reload-app.ts`).
 *
 * Expo's native fetch parks a closure that owns the JS promise until the response reaches a
 * terminal state. When the runtime is torn down first, that closure is destroyed against the
 * dead runtime on the fetch queue and the app crashes with SIGSEGV. Aborting a request makes the
 * native side settle it right away, while the runtime is still alive.
 *
 * Expo installs its fetch as the global `fetch` as well, so `installGlobalFetchTracking` wraps
 * that one too; the API client and the TTS service wrap their explicit `expo/fetch` import.
 */

type FetchInit = { signal?: AbortSignal | null } | undefined

/** The shape of an `expo/fetch` response we rely on: an event emitter that says when it is done. */
type FinalizableResponse = {
  addListener?: (eventName: string, listener: () => void) => { remove: () => void }
}

/** Emitted by the native response once the task finished, failed or was cancelled. */
const FINALIZATION_EVENT = "readyForJSFinalization"

const inFlight = new Set<AbortController>()
const idleListeners = new Set<() => void>()

const notifyIdle = () => {
  if (inFlight.size > 0) {
    return
  }
  const listeners = [...idleListeners]
  idleListeners.clear()
  for (const listener of listeners) {
    listener()
  }
}

const release = (controller: AbortController) => {
  if (inFlight.delete(controller)) {
    notifyIdle()
  }
}

/**
 * The fetch promise settles once the headers arrive, but the native task, and the closure it
 * holds, live on until the body finished. Keep the request in flight, and the caller's abort
 * forwarded, until the response says it is done; responses without that signal count as done
 * right away.
 */
const settleWhenFinalized = (response: unknown, settle: () => void) => {
  const emitter = response as FinalizableResponse | null
  if (!emitter || typeof emitter.addListener !== "function") {
    settle()
    return
  }

  try {
    const subscription = emitter.addListener(FINALIZATION_EVENT, () => {
      subscription.remove()
      settle()
    })
  } catch {
    settle()
  }
}

/**
 * Wrap a fetch implementation so every request is tracked and can be aborted from
 * `abortInFlightRequests`. A signal passed by the caller keeps working.
 */
export const trackFetch = <TInput, TInit extends FetchInit, TResponse>(
  fetchImpl: (input: TInput, init?: TInit) => Promise<TResponse>,
): ((input: TInput, init?: TInit) => Promise<TResponse>) => {
  return async (input, init) => {
    const controller = new AbortController()
    const outerSignal = init?.signal ?? null
    const forwardAbort = () => controller.abort(outerSignal?.reason)

    if (outerSignal?.aborted) {
      forwardAbort()
    } else {
      outerSignal?.addEventListener("abort", forwardAbort, { once: true })
    }

    // The caller's abort also cancels a body that is still downloading, as with a plain fetch
    const settle = () => {
      outerSignal?.removeEventListener("abort", forwardAbort)
      release(controller)
    }

    inFlight.add(controller)
    let response: TResponse
    try {
      response = await fetchImpl(input, { ...init, signal: controller.signal } as TInit)
    } catch (error) {
      settle()
      throw error
    }

    settleWhenFinalized(response, settle)
    return response
  }
}

let globalFetchTracked = false

/** Replace the global `fetch` (Expo's own) with the tracked wrapper. Safe to call more than once. */
export const installGlobalFetchTracking = () => {
  if (globalFetchTracked || typeof globalThis.fetch !== "function") {
    return
  }
  const tracked = trackFetch(globalThis.fetch)
  Object.defineProperty(globalThis, "fetch", {
    value: tracked,
    configurable: true,
    enumerable: true,
    writable: true,
  })
  globalFetchTracked = true
}

export const getInFlightRequestCount = () => inFlight.size

export const abortInFlightRequests = (reason?: unknown) => {
  for (const controller of inFlight) {
    controller.abort(reason)
  }
}

/**
 * Resolve once no tracked request is in flight, or after `timeoutMs`. Resolves with whether the
 * network went idle in time.
 */
export const waitForNetworkIdle = (timeoutMs: number) =>
  new Promise<boolean>((resolve) => {
    if (inFlight.size === 0) {
      resolve(true)
      return
    }

    const onIdle = () => {
      clearTimeout(timer)
      resolve(true)
    }
    const timer = setTimeout(() => {
      idleListeners.delete(onIdle)
      resolve(false)
    }, timeoutMs)
    idleListeners.add(onIdle)
  })
