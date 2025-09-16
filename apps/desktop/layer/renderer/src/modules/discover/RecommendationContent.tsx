import type { RSSHubRouteMetadata } from "@follow-app/client-sdk"

import { DiscoverFeedForm } from "./DiscoverFeedForm"

export const RecommendationContent = ({
  route,
  routePrefix,
}: {
  route: RSSHubRouteMetadata
  routePrefix: string
}) => (
  <div className="mx-auto w-full max-w-[700px] sm:min-w-[550px]">
    <DiscoverFeedForm route={route} routePrefix={routePrefix} />
  </div>
)
