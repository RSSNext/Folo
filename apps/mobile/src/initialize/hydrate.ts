import { persistQueryClient } from "@tanstack/react-query-persist-client"

import { kvStoragePersister, queryClient } from "../lib/query-client"

export { hydrateDatabaseToStore } from "../store"
export const hydrateSettings = () => {}
export const hydrateQueryClient = () => {
  persistQueryClient({
    queryClient,
    persister: kvStoragePersister,
    dehydrateOptions: {
      shouldDehydrateQuery(query) {
        return query.queryKey.includes("cache")
      },
      shouldDehydrateMutation() {
        return false
      },
    },
    maxAge: 1000 * 60 * 60 * 24 * 1,
  })
}
