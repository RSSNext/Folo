import { useQuery } from "@tanstack/react-query"

import { apiClient } from "~/lib/api-fetch"

export const useServerConfigsQuery = () => {
  const { data } = useQuery({
    queryKey: ["server-configs"],
    queryFn: () => apiClient.status.configs.$get(),
  })
  return data?.data
}
