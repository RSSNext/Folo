import type { FeedViewType } from "@follow/constants"

export interface EntryHeaderProps {
  view: FeedViewType
  entryId: string
  className?: string
  compact?: boolean
}
