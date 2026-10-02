import type { FeedSchema, ParsedEntry } from "@follow-app/client-sdk"

export type EntryWithFeed = ParsedEntry & {
  /**
   * The entry's own feed. List responses mix entries from several feeds and attach it here.
   */
  feeds?: Nullable<FeedSchema>
}

export interface FeedEntryItem {
  entry: ParsedEntry
  feed: Nullable<FeedSchema>
}
