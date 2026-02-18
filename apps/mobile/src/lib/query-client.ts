import { FollowAPIError } from "@follow-app/client-sdk"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { QueryClient } from "@tanstack/react-query"
import { FetchError } from "ofetch"

import { kv } from "./kv"

const defaultStaleTime = 600_000 // 10min
const DO_NOT_RETRY_CODES = new Set([400, 401, 403, 404, 422, 402])
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      retryDelay: 1000,
      staleTime: defaultStaleTime,
      retry(failureCount, error) {
        if (
          error instanceof FetchError &&
          (error.statusCode === undefined || DO_NOT_RETRY_CODES.has(error.statusCode))
        ) {
          return false
        }

        if (error instanceof FollowAPIError && DO_NOT_RETRY_CODES.has(error.status)) {
          return false
        }

        return !!(3 - failureCount)
      },
      // throwOnError: import.meta.env.DEV,
    },
  },
})

export const kvStoragePersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => kv.getSync(key),
    setItem: (key: string, value: string) => kv.setSync(key, value),
    removeItem: (key: string) => kv.delete(key),
  },
})
