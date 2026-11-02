/** What the footer below the last entry shows for the next page */
export type NextPageFooterState = "end" | "loading" | "error" | "idle"

/**
 * The list shows a placeholder whenever there is a next page. Only a request under way
 * animates it, and a failed request offers a retry instead of looking like it is still
 * loading.
 */
export const getNextPageFooterState = ({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
}): NextPageFooterState => {
  if (!hasNextPage) return "end"
  if (isFetchingNextPage) return "loading"
  if (isFetchNextPageError) return "error"
  return "idle"
}

/**
 * Whether the list may ask for its next page now. A page already on its way or one that failed
 * waits, so scrolling cannot ask again and again.
 */
export const canLoadNextPage = ({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
}) => hasNextPage && !isFetchingNextPage && !isFetchNextPageError

/**
 * Whether the viewable items include the last entry of a list. FlashList's `onEndReached`
 * may not fire when it should, so the list also pages from what the user can see.
 */
export const isLastEntryViewable = (
  viewableItems: ReadonlyArray<{ index: number | null }>,
  entryCount: number,
) => entryCount > 0 && viewableItems.some((item) => item.index === entryCount - 1)
