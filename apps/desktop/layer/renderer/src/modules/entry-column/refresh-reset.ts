export const shouldScrollTimelineToTopOnRefreshStateChange = ({
  wasRefreshing,
  isRefreshing,
}: {
  wasRefreshing: boolean
  isRefreshing: boolean
}) => !wasRefreshing && isRefreshing
