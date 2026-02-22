import { AsyncLocalStorage } from "node:async_hooks"

// Shim for @fastify/request-context that works in Workers
// Uses AsyncLocalStorage to provide per-request context

const storage = new AsyncLocalStorage<Map<string, any>>()

export const requestContext = {
  get(key: string) {
    const store = storage.getStore()
    return store?.get(key)
  },
  set(key: string, value: any) {
    const store = storage.getStore()
    store?.set(key, value)
  },
}

export function runWithRequestContext<T>(fn: () => T | Promise<T>): T | Promise<T> {
  const store = new Map<string, any>()
  return storage.run(store, fn)
}

// Provide a req-like object with requestContext for compatibility
export function createRequestProxy(
  url: string,
  headers: Record<string, string>,
  params: Record<string, string> = {},
) {
  return {
    originalUrl: url,
    headers,
    params,
    requestContext: {
      get(key: string) {
        return requestContext.get(key)
      },
      set(key: string, value: any) {
        requestContext.set(key, value)
      },
    },
  }
}
