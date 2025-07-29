import { apiClient } from "@client/lib/api-fetch"
import { getHydrateData } from "@client/lib/helper"
import { useQuery } from "@tanstack/react-query"

import type { Feed } from "./feed"

const fetchEntriesPreview = async ({ id }: { id?: string }) => {
  const res = await apiClient.entries.preview.$get({
    query: {
      id: id!,
    },
  })

  return res.data
}
export const useEntriesPreview = ({ id }: { id?: string }) => {
  return useQuery({
    queryKey: ["entries-preview", id],
    queryFn: () => fetchEntriesPreview({ id }),
    enabled: !!id,
    initialData: getHydrateData(`feeds.$get,query:id=${id}`)?.["entries"],
  })
}

export type EntriesPreview = (Awaited<ReturnType<typeof fetchEntriesPreview>>[number] & {
  feeds?: Feed["feed"]
})[]
