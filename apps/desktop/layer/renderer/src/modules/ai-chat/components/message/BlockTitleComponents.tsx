import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
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
  const feed = useFeedById(feedId, (feed) => ({ title: feed?.title }))

  if (!feedId || !feed?.title) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span title={feed.title}>{feed.title}</span>
})

FeedTitle.displayName = "FeedTitle"
