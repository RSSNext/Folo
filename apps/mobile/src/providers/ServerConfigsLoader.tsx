import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { setServerConfigs } from "@/src/atoms/server-configs"

import { followClient } from "../lib/api-client"

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
    queryFn: () => followClient.api.status.getConfigs(),
  })
  return data?.data
}
