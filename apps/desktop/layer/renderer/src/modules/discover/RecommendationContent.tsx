import { DiscoverFeedForm } from "./DiscoverFeedForm"
import type { RSSHubRoute } from "./types"

export const RecommendationContent = ({
  route,
  routePrefix,
}: {
  route: RSSHubRoute
  routePrefix: string
}) => (
  <div className="mx-auto w-full max-w-[700px] sm:min-w-[550px]">
    <DiscoverFeedForm route={route} routePrefix={routePrefix} />
  </div>
)
