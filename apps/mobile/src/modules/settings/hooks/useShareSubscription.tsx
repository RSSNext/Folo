import type { UseQueryResult } from "@tanstack/react-query"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import { apiClient } from "@/src/lib/api-fetch"

// eslint-disable-next-line unused-imports/no-unused-vars
type ExtractQueryData<T> = T extends UseQueryResult<infer T> ? T : never
export const useShareSubscription = ({ userId }: { userId: string }) => {
  const queryKey = useMemo(() => ["public", "subscription", userId], [userId])
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const subscriptions = await apiClient.subscriptions.$get({
        query: {
          userId,
        },
      })

      return subscriptions
    },
  })
  const queryClient = useQueryClient()
  return {
    ...query,
    removeItemById: useCallback(
      (id: string) => {
        type QueryData = ExtractQueryData<typeof query>
        queryClient.cancelQueries({ queryKey })
        queryClient.setQueryData<QueryData>(queryKey, (data) => {
          if (!data) return
          return {
            ...data,
            data: data?.data.filter((item) => item.feedId !== id),
          }
        })
      },
      [queryClient, queryKey],
    ),
  }
}
