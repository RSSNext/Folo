import { useEntry } from "@follow/store/entry/hooks"
import { useFeedsByIds } from "@follow/store/feed/hooks"
import * as React from "react"

interface TitleProps {
  fallback: string
}

interface EntryTitleProps extends TitleProps {
  entryId?: string
}

interface FeedTitleProps extends TitleProps {
  feedId?: string
}

/**
 * Displays entry title with fallback handling
 */
export const EntryTitle: React.FC<EntryTitleProps> = React.memo(({ entryId, fallback }) => {
  const entryTitle = useEntry(entryId!, (e) => e?.title)

  if (!entryId || !entryTitle) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span title={entryTitle}>{entryTitle}</span>
})

EntryTitle.displayName = "EntryTitle"

/**
 * Displays feed title with fallback handling
 */
export const FeedTitle: React.FC<FeedTitleProps> = React.memo(({ feedId, fallback }) => {
  const finalFeedIds = feedId?.split(",").map((id) => id.trim())
  const feeds = useFeedsByIds(finalFeedIds, (feed) => ({ title: feed?.title }))
  const feedTitles = feeds.map((feed) => feed.title).join(", ")

  if (!feedId || !feedTitles) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span title={feedTitles}>{feedTitles}</span>
})

FeedTitle.displayName = "FeedTitle"
