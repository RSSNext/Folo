import { tracker } from "@follow/tracker"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { apiClient } from "../context"
import type { GeneralQueryOptions } from "../types"
import { isNewUserQueryKey } from "./constants"
import { userSyncService, useUserStore } from "./store"

export const whoamiQueryKey = ["user", "whoami"]

export const usePrefetchSessionUser = () => {
  const query = useQuery({
    queryKey: whoamiQueryKey,
    queryFn: () => userSyncService.whoami(),
  })

  useEffect(() => {
    if (query.data) {
      const user = query.data
      tracker.identify(user)
    }
  }, [query.data])
  return query
}

export const useWhoami = () => {
  return useUserStore((state) => state.whoami)
}

export const useRole = () => {
  return useUserStore((state) => state.role)
}

export const useUser = (userId?: string) => {
  return useUserStore((state) => (userId ? state.users[userId] : undefined))
}

export function useIsNewUser(options?: GeneralQueryOptions) {
  const { data } = useQuery({
    enabled: options?.enabled,
    queryKey: isNewUserQueryKey,
    queryFn: async () => {
      const subscriptions = await apiClient().subscriptions.$get({ query: {} })
      return subscriptions.data.length < 5
    },
  })
  return !!data
}
