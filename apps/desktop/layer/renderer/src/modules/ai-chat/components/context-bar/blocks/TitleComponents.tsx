import { useEntry } from "@follow/store/entry/hooks"
import { useFeedsByIds } from "@follow/store/feed/hooks"
import type { FC } from "react"

export const EntryTitle: FC<{ entryId?: string; fallback: string }> = ({ entryId, fallback }) => {
  const entryTitle = useEntry(entryId!, (e) => e?.title)

  if (!entryId || !entryTitle) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{entryTitle}</span>
}

export const FeedTitle: FC<{ feedId?: string; fallback: string }> = ({ feedId, fallback }) => {
  const finalFeedIds = feedId?.split(",").map((id) => id.trim())
  const feeds = useFeedsByIds(finalFeedIds, (feed) => ({ title: feed?.title }))
  const feedTitles = feeds.map((feed) => feed.title).join(", ")

  if (!feedId || !feedTitles) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{feedTitles}</span>
}
