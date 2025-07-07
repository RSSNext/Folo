import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { setServerConfigs } from "@/src/atoms/server-configs"
import { apiClient } from "@/src/lib/api-fetch"

export const ServerConfigsLoader = () => {
  const serverConfigs = useServerConfigsQuery()

  useEffect(() => {
    if (!serverConfigs) return
    setServerConfigs(serverConfigs)
  }, [serverConfigs])

  return null
}

const useServerConfigsQuery = () => {
  const { data } = useQuery({
    queryKey: ["server-configs"],
    queryFn: () => apiClient.status.configs.$get(),
  })
  return data?.data
}
