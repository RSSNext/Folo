import type { FC } from "react"

import { useSortedUngroupedSubscription } from "@/src/store/subscription/hooks"

import { useFeedListSortMethod, useFeedListSortOrder } from "./atoms"
import { SubscriptionItem } from "./items/SubscriptionItem"

export const UnGroupedList: FC<{
  subscriptionIds: string[]
  isGroupLast?: boolean
}> = ({ subscriptionIds, isGroupLast }) => {
  const sortBy = useFeedListSortMethod()
  const sortOrder = useFeedListSortOrder()
  const sortedSubscriptionIds = useSortedUngroupedSubscription(subscriptionIds, sortBy, sortOrder)

  return sortedSubscriptionIds.map((id, index) => (
    <SubscriptionItem
      key={id}
      id={id}
      isFirst={false}
      isLast={!!isGroupLast && index === sortedSubscriptionIds.length - 1}
    />
  ))
}
