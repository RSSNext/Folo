import { useEventCallback } from "usehooks-ts"

import { useAsyncModal } from "~/components/ui/modal/helper/use-async-modal"
import { RecommendationContent } from "~/modules/discover/recommendation-content"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { discover } from "~/queries/discover"

import { useAuthQuery } from "../common"

export const useDiscoverRSSHubRouteModal = () => {
  const present = useAsyncModal()

  return useEventCallback((route: string) => {
    const useDataFetcher = () => useAuthQuery(discover.rsshubRoute({ route }))
    type ResponseType = Awaited<ReturnType<ReturnType<typeof useDataFetcher>["fn"]>>
    return present<ResponseType>({
      id: `rsshub-discover-${route}`,
      content: ({ data }: { data: ResponseType }) => (
        <RecommendationContent routePrefix={data.prefix} route={data.route} />
      ),
      icon: (data: ResponseType) => (
        <FeedIcon className="size-4" size={16} siteUrl={`https://${data.url}`} />
      ),
      title: (data: ResponseType) => `${data.name} - ${data.route.name}`,

      useDataFetcher,
    })
  })
}
