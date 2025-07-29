import { useQuery } from "@tanstack/react-query"

import { followApi } from "~/lib/api-client"

export const useServerConfigsQuery = () => {
  const { data } = useQuery({
    queryKey: ["server-configs"],
    queryFn: () => followApi.status.getConfigs(),
  })
  return data?.data
}
