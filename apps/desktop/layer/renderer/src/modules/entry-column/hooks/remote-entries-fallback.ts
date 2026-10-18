import type { UseEntriesReturn } from "@follow/store/entry/types"
import { fallbackReturn } from "@follow/store/entry/utils"
import type { FetchStatus } from "@tanstack/react-query"

export type RemoteEntriesReturn = UseEntriesReturn & {
  /** The first page waits for the browser to come back online. */
  isOffline?: boolean
}

interface FirstPageQuery {
  isError: boolean
  isFetching: boolean
  error: Error | null
  fetchStatus: FetchStatus
}

/**
 * What the remote list reports before its first page arrived. While the browser is offline
 * TanStack does not send that request but waits for the connection, so the list is not
 * loading: it is empty for a reason the user can see.
 */
export const getRemoteEntriesFallback = (
  query: FirstPageQuery,
  refetch: () => Promise<void>,
): RemoteEntriesReturn => {
  if (query.isError) {
    return {
      ...fallbackReturn,
      refetch,
      isLoading: query.isFetching,
      isFetching: query.isFetching,
      error: query.error,
    }
  }
  if (query.fetchStatus === "paused") {
    return { ...fallbackReturn, refetch, isLoading: false, isOffline: true }
  }
  return fallbackReturn
}
