import { FeedViewType } from "@follow/constants"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { useEntriesByView } from "../useEntriesByView"

/**
 * Hook for managing entry data in subscription column context
 * Uses local entries only for better performance in sidebar
 */
export const useEntrySubscriptionData = () => {
  const { view = FeedViewType.Articles } = useRouteParams()

  // Reuse the same data source logic as EntryColumn's ListComponent
  // to ensure entries are identical in order, filtering, and paging.
  const entriesData = useEntriesByView({})

  return {
    entriesIds: entriesData.entriesIds,
    hasNextPage: entriesData.hasNextPage,
    isFetchingNextPage: entriesData.isFetchingNextPage,
    fetchNextPage: entriesData.fetchNextPage,
    refetch: entriesData.refetch,
    view,
  }
}
