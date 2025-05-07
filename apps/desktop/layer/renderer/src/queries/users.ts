import { useQuery } from "@tanstack/react-query"

import { useIsInMASReview } from "~/atoms/server-configs"
import { apiClient } from "~/lib/api-fetch"
import { getProviders } from "~/lib/auth"
import { defineQuery } from "~/lib/defineQuery"

export const users = {
  profile: ({ userId }: { userId: string }) =>
    defineQuery(["profiles", userId], async () => {
      const res = await apiClient.profiles.$get({
        query: { id: userId! },
      })
      return res.data
    }),
}

export interface AuthProvider {
  name: string
  id: string
  color: string
  icon: string
}
export const useAuthProviders = () => {
  const isInMASReview = useIsInMASReview()
  return useQuery({
    queryKey: ["providers", isInMASReview],
    queryFn: async () => {
      if (isInMASReview) {
        return {}
      } else {
        return (await getProviders()).data as Record<string, AuthProvider>
      }
    },
  })
}
