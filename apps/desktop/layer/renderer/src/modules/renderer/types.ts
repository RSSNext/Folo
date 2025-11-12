import type { FeedViewType } from "@follow-app/client-sdk"

export type EntryContentRendererProps = {
  view: FeedViewType
  feedId: string
  entryId: string
  children: Nullable<string>
}
