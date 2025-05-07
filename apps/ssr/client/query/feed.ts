import { apiClient } from "@client/lib/api-fetch"
import { getHydrateData } from "@client/lib/helper"
import type { FeedHydrateData } from "@client/pages/(main)/share/feeds/[id]/metadata"
import { useQuery } from "@tanstack/react-query"

async function fetchFeedById(id: string) {
  const res = await apiClient.feeds.$get({
    query: {
      id,
    },
  })
  return res.data
}

export const useFeed = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: ["feed", id],
    queryFn: () => fetchFeedById(id),
    initialData: getHydrateData(`feeds.$get,query:id=${id}`) as FeedHydrateData,
  })
}

export type Feed = Awaited<ReturnType<typeof fetchFeedById>>
