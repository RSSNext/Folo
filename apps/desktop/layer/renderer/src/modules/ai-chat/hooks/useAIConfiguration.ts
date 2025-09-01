import { useQuery } from "@tanstack/react-query"

import { followApi } from "~/lib/api-client"

export const useAIConfiguration = () => {
  return useQuery({
    queryKey: ["aiConfiguration"],
    queryFn: async () => {
      return followApi.ai.config()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
