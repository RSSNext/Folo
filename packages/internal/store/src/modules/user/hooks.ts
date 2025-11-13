import { tracker } from "@follow/tracker"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { api, queryClient } from "../../context"
import type { GeneralQueryOptions } from "../../types"
import { isNewUserQueryKey } from "./constants"
import type { UserStore } from "./store"
import { userSyncService, useUserStore } from "./store"

export const whoamiQueryKey = ["user", "whoami"]

export const invalidateUserSession = () => {
  queryClient().invalidateQueries({
    queryKey: whoamiQueryKey,
  })
}

export const usePrefetchSessionUser = () => {
  const query = useQuery({
    queryKey: whoamiQueryKey,
    queryFn: () => userSyncService.whoami(),
  })

  useEffect(() => {
    if (query.data) {
      const { user } = query.data
      user && tracker.identify(user)
    }
  }, [query.data])
  return query
}

export const usePrefetchUser = (userId: string | undefined) => {
  const query = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userSyncService.fetchUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
  return query
}

const whoamiSelector = (state: UserStore) => state.whoami
export const useWhoami = () => {
  return useUserStore(whoamiSelector)
}

const loggedInSelector = (state: UserStore) => !!state.whoami
const roleSelector = (state: UserStore) => state.role
export const useIsLoggedIn = () => {
  return useUserStore(loggedInSelector)
}
export const useUserRole = () => {
  return useUserStore(roleSelector)
}

const roleEndAtSelector = (state: UserStore) => state.roleEndAt
export const useRoleEndAt = () => {
  return useUserStore(roleEndAtSelector)
}

export const useUserSubscriptionLimit = () => {
  const rsshubLimit = useUserStore((state) => state.rsshubSubscriptionLimit)
  const feedLimit = useUserStore((state) => state.feedSubscriptionLimit)
  return {
    rsshubLimit,
    feedLimit,
  }
}

export const useUserById = (userId: string | undefined) => {
  return useUserStore((state) => (userId ? state.users[userId] : undefined))
}

export const useUserList = (userIds: string[]) => {
  return useUserStore((state) => {
    return userIds.map((id) => state.users[id]).filter((i) => !!i)
  })
}

export function useIsNewUser(options?: GeneralQueryOptions) {
  const { data } = useQuery({
    enabled: options?.enabled,
    queryKey: isNewUserQueryKey,
    queryFn: async () => {
      const subscriptions = await api().subscriptions.get({})
      return subscriptions.data.length < 5
    },
  })
  return !!data
}
