import type { FeedViewType } from "@follow/constants"

export type FeedListProps = {
  view: number
  data: Record<string, string[]>
  categoryOpenStateData: Record<string, boolean>
}
export type SortBy = "count" | "alphabetical"

export type ListListProps = {
  view: FeedViewType
  data: Record<string, string[]>
}
