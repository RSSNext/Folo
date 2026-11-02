/**
 * Whether the placeholders of a loading timeline animate. A page next to the shown one in the
 * pager does not load until it is shown, so its placeholders hold still instead.
 */
export const shouldAnimateLoadingPlaceholder = ({ active }: { active?: boolean }) =>
  active !== false

/**
 * Whether the placeholder below the last entry animates. The list keeps it as long as there is a
 * next page, mostly far below the screen, so it animates only while that page loads.
 */
export const shouldAnimateNextPagePlaceholder = ({
  active,
  isFetchingNextPage,
}: {
  active?: boolean
  isFetchingNextPage: boolean
}) => active !== false && isFetchingNextPage
