import type { UseEntriesReturn } from "@follow/store/entry/types"
import { fallbackReturn } from "@follow/store/entry/utils"

export type RemoteTimelineEntries = UseEntriesReturn & {
  /** Fetches the first page again and tells the user when that fails */
  refetchReportingFailure: () => Promise<void>
}

/**
 * Pulling to refresh keeps the entries on screen as they were when it fails, which alone would
 * not say that it failed. An empty list says why itself.
 */
const reportFailedRefresh = (
  shown: UseEntriesReturn,
  remote: RemoteTimelineEntries,
): UseEntriesReturn =>
  shown.entriesIds.length > 0 ? { ...shown, refetch: remote.refetchReportingFailure } : shown

/**
 * What a view's timeline on Home shows. The server's first page wins once it is in. Until then
 * the entries stored on the device show, as they do when that page fails: a request can take
 * until it times out, and a refresh after a failed one starts over without its error, so waiting
 * for either would hide them behind placeholders. Without stored entries the placeholders show.
 */
export const pickTimelineEntries = (
  remote: RemoteTimelineEntries,
  local: UseEntriesReturn,
): UseEntriesReturn => {
  if (remote.isReady) {
    return reportFailedRefresh(remote, remote)
  }

  if (remote.error || local.entriesIds.length > 0) {
    return reportFailedRefresh(
      {
        ...local,
        // Pulling to refresh retries the server rather than the stored entries
        refetch: remote.refetch,
        isFetching: remote.isFetching,
        isRefetching: remote.isRefetching,
        error: remote.error,
        isReady: true,
      },
      remote,
    )
  }

  return {
    ...fallbackReturn,
    refetch: remote.refetch,
    fetchNextPage: remote.fetchNextPage,
    isLoading: remote.isLoading,
    isFetching: remote.isFetching,
    isRefetching: remote.isRefetching,
  }
}
