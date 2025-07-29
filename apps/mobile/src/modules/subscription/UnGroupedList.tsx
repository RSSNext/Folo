import { useSortedUngroupedSubscription } from "@follow/store/subscription/hooks"
import type { FC } from "react"

import { useHideAllReadSubscriptions } from "@/src/atoms/settings/general"

import { useFeedListSortMethod, useFeedListSortOrder } from "./atoms"
import { SubscriptionItem } from "./items/SubscriptionItem"

export const UnGroupedList: FC<{
  subscriptionIds: string[]
  isLastGroup?: boolean
}> = ({ subscriptionIds, isLastGroup }) => {
  const sortBy = useFeedListSortMethod()
  const sortOrder = useFeedListSortOrder()
  const hideAllReadSubscriptions = useHideAllReadSubscriptions()
  const sortedSubscriptionIds = useSortedUngroupedSubscription({
    ids: subscriptionIds,
    sortBy,
    sortOrder,
    hideAllReadSubscriptions,
  })

  return sortedSubscriptionIds.map((id, index) => (
    <SubscriptionItem
      key={id}
      id={id}
      isFirst={false}
      isLast={!!isLastGroup && index === sortedSubscriptionIds.length - 1}
    />
  ))
}
