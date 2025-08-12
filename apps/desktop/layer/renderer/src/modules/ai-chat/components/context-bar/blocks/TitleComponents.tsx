import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import type { FC } from "react"

export const EntryTitle: FC<{ entryId?: string; fallback: string }> = ({ entryId, fallback }) => {
  const entryTitle = useEntry(entryId!, (e) => e?.title)

  if (!entryId || !entryTitle) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{entryTitle}</span>
}

export const FeedTitle: FC<{ feedId?: string; fallback: string }> = ({ feedId, fallback }) => {
  const feed = useFeedById(feedId, (feed) => ({ title: feed?.title }))
  if (!feedId || !feed) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{feed.title}</span>
}
