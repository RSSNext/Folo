import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { QueryClient } from "@tanstack/react-query"

import { kv } from "./kv"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
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
