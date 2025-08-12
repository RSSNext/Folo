import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { useAllFeedSubscription } from "@follow/store/subscription/hooks"
import type { FC } from "react"
import { useMemo } from "react"

import { DropdownMenuItem } from "~/components/ui/dropdown-menu/dropdown-menu"

import type { PickerItem } from "./PickerList"
import { PickerList } from "./PickerList"

export const FeedPickerList: FC<{ onSelect: (feedId: string) => void }> = ({ onSelect }) => {
  const allSubscriptions = useAllFeedSubscription()

  // Get feeds with their details
  const feeds = useMemo(() => {
    return allSubscriptions
      .filter((subscription) => subscription.feedId)
      .map((subscription) => {
        const customTitle = subscription.title

        if (!subscription.feedId) return null
        const feed = getFeedById(subscription.feedId!)
        return {
          id: subscription.feedId!,
          title: customTitle || feed?.title || `Feed ${subscription.feedId}`,
        } as PickerItem
      })
      .filter(Boolean) as PickerItem[]
  }, [allSubscriptions])

  return (
    <PickerList
      items={feeds}
      placeholder="Search feeds..."
      onSelect={onSelect}
      noResultsText="No feeds found"
      renderItem={(feed, onSelect) => (
        <FeedPickerItem key={feed.id} feedId={feed.id} title={feed.title} onSelect={onSelect} />
      )}
    />
  )
}

// Individual Feed Picker Item that shows real feed title
const FeedPickerItem: FC<{
  feedId: string
  title: string
  onSelect: (feedId: string) => void
}> = ({ feedId, title, onSelect }) => {
  const feed = useFeedById(feedId, (feed) => ({ title: feed?.title }))
  const displayTitle = feed?.title || title || "Untitled Feed"

  return (
    <DropdownMenuItem onClick={() => onSelect(feedId)} className="text-xs">
      <span className="truncate">{displayTitle}</span>
    </DropdownMenuItem>
  )
}
