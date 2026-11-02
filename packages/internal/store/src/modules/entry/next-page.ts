import type { FetchNextPageOptions, QueryState } from "@tanstack/react-query"

/**
 * Asks an entry list for its next page.
 *
 * TanStack folds a request made while the list is refetched from its first page into that
 * refetch, which loads no page. A refresh trims the list to its first page, so a short list
 * asks for its empty end page again while the refresh runs. When the same entries come back,
 * the list data keeps its identity and a list that only asks when its data changes, like the
 * mobile one, would show its loading footer forever. Such a request is made again once the
 * refetch succeeded.
 */
export const fetchNextPageAfterRefetch = async <
  TResult extends { hasNextPage: boolean; isSuccess: boolean },
>(
  state: Pick<QueryState, "fetchMeta" | "fetchStatus"> | undefined,
  fetchNextPage: (options: FetchNextPageOptions) => Promise<TResult>,
  options?: FetchNextPageOptions,
): Promise<TResult> => {
  const fetchOptions = { cancelRefetch: false, ...options }
  const joinsRefetch =
    !fetchOptions.cancelRefetch && state?.fetchStatus === "fetching" && !state.fetchMeta?.fetchMore
  const result = await fetchNextPage(fetchOptions)
  return joinsRefetch && result.isSuccess && result.hasNextPage
    ? fetchNextPage(fetchOptions)
    : result
}
