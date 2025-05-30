import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import type { OmitKeyof } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client"
import { FetchError } from "ofetch"

import { QUERY_PERSIST_KEY } from "../constants/app"

const defaultStaleTime = 600_000 // 10min
const DO_NOT_RETRY_CODES = new Set([400, 401, 403, 404, 422])
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retryDelay: 1000,
      staleTime: defaultStaleTime,
      retry(failureCount, error) {
        console.error(error)
        if (
          error instanceof FetchError &&
          (error.statusCode === undefined || DO_NOT_RETRY_CODES.has(error.statusCode))
        ) {
          return false
        }

        return !!(3 - failureCount)
      },
      // throwOnError: import.meta.env.DEV,
    },
  },
})
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: QUERY_PERSIST_KEY,
})

declare module "@tanstack/react-query" {
  interface Meta {
    queryMeta: { persist?: boolean }
  }

  interface Register extends Meta {}
}

export const persistConfig: OmitKeyof<PersistQueryClientOptions, "queryClient"> = {
  persister: localStoragePersister,
  // 7 day
  maxAge: 7 * 24 * 60 * 60 * 1000,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      if (!query.meta?.persist) return false
      const queryIsReadyForPersistence = query.state.status === "success"
      if (queryIsReadyForPersistence) {
        return (
          !((query.state?.data as any)?.pages?.length > 1) && query.queryKey?.[0] !== "check-eagle"
        )
      } else {
        return false
      }
    },
  },
}

export { queryClient }
