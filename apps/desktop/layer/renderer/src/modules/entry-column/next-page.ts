/**
 * Whether the timeline may ask for its next page now. A request made while the first page is
 * refetched joins that refetch and is dropped, and a refresh trims the list to its first page,
 * so a short list would wait for its empty last page forever. The list asks again once the
 * fetch is done.
 */
export const canFetchNextPage = (state: { hasNextPage: boolean; isFetching: boolean }) =>
  state.hasNextPage && !state.isFetching
