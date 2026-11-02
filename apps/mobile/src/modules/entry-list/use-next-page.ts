import { useCallback } from "react"

import { canLoadNextPage, getNextPageFooterState } from "./next-page"

/** The footer state of a list's next page, and the two ways to ask for it */
export const useNextPage = ({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => Promise<void> | void
}) => {
  const footerState = getNextPageFooterState({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  })

  const retry = useCallback(() => void fetchNextPage(), [fetchNextPage])
  const loadMore = useCallback(() => {
    if (!canLoadNextPage({ hasNextPage, isFetchingNextPage, isFetchNextPageError })) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage])

  return { footerState, retry, loadMore }
}
