import { setServerConfigs } from "@client/atoms/server-configs"
import { apiClient } from "@client/lib/api-fetch"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

const useServerConfigsQuery = () => {
  const { data } = useQuery({
    queryKey: ["server-configs"],
    queryFn: async () => await apiClient.status.configs.$get(),
  })
  return data?.data
}

export const ServerConfigsProvider = () => {
  const serverConfigs = useServerConfigsQuery()

  useEffect(() => {
    if (!serverConfigs) return
    setServerConfigs(serverConfigs)
  }, [serverConfigs])

  return null
}
