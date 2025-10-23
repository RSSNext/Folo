import { useEntry } from "@follow/store/entry/hooks"
import { useFeedsByIds } from "@follow/store/feed/hooks"
import type { FC } from "react"

import { ROUTE_FEED_IN_FOLDER } from "~/constants"

export const EntryTitle: FC<{ entryId?: string; fallback: string }> = ({ entryId, fallback }) => {
  const entryTitle = useEntry(entryId!, (e) => e?.title)

  if (!entryId || !entryTitle) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{entryTitle}</span>
}

export const FeedTitle: FC<{ feedId?: string; fallback: string; className?: string }> = ({
  feedId,
  fallback,
  className,
}) => {
  const category = feedId?.startsWith(ROUTE_FEED_IN_FOLDER)
    ? feedId.slice(ROUTE_FEED_IN_FOLDER.length)
    : undefined
  const finalFeedIds = feedId?.split(",").map((id) => id.trim())
  const feeds = useFeedsByIds(finalFeedIds, (feed) => ({ title: feed?.title }))
  const feedTitles = feeds.map((feed) => feed.title).join(", ")

  if (!feedId || !feedTitles) {
    if (category) {
      return <span className={className}>{category}</span>
    }

    return <span className={`text-text-tertiary ${className}`}>{fallback}</span>
  }

  return <span className={className}>{feedTitles}</span>
}
