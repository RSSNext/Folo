import { apiClient } from "@client/lib/api-fetch"
import { getHydrateData } from "@client/lib/helper"
import { useQuery } from "@tanstack/react-query"

const fetchListById = async (id: string) => {
  const res = await apiClient.lists.$get({ query: { listId: id } })
  return res.data
}
export const useList = ({ id }: { id?: string }) =>
  useQuery({
    queryKey: ["lists", id],
    queryFn: () => fetchListById(id!),
    enabled: !!id,
    initialData: getHydrateData(`lists.$get,query:listId=${id}`) as any as Awaited<
      ReturnType<typeof fetchListById>
    >,
  })
