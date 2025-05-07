import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"

export const serverConfigs = {
  get: () => defineQuery(["server-configs"], async () => await apiClient.status.configs.$get()),
}

export const useServerConfigsQuery = () => {
  const { data } = useAuthQuery(serverConfigs.get())
  return data?.data
}
