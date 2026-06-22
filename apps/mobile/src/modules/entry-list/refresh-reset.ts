export const shouldScrollEntryListToTopOnRefreshStateChange = ({
  wasRefreshing,
  isRefreshing,
}: {
  wasRefreshing: boolean
  isRefreshing: boolean
}) => !wasRefreshing && isRefreshing
