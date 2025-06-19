import { useQuery } from "@tanstack/react-query"

import { useIsInMASReview } from "~/atoms/server-configs"
import { getProviders } from "~/lib/auth"

export interface AuthProvider {
  name: string
  id: string
  color: string
  icon: string
  icon64: string
  iconDark64?: string
}
export const useAuthProviders = () => {
  const isInMASReview = useIsInMASReview()
  return useQuery({
    queryKey: ["providers", isInMASReview],
    queryFn: async () => {
      const data = (await getProviders()).data as Record<string, AuthProvider>
      if (isInMASReview) {
        if (data.credential) {
          return {
            credential: data.credential,
          }
        } else {
          return {}
        }
      } else {
        return data
      }
    },
  })
}
