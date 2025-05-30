import type { FeedViewType } from "@follow/constants"
import type { CombinedEntryModel, EntryReadHistoriesModel } from "@follow/models/types"

type FeedId = string
type EntryId = string
type EntriesIdTable = Record<FeedId, EntryId[]>

export type FlatEntryModel = Omit<CombinedEntryModel, "feeds"> & {
  view?: number
} & { feedId: FeedId; inboxId: string }
export interface EntryState {
  /**
   * A map of feedId to entryIds
   */
  entries: EntriesIdTable
  /**
   * A map of entryId to entry
   */
  flatMapEntries: Record<FeedId, FlatEntryModel>
  /**
   * A map of feedId to entryId set, to quickly check if an entryId is in the feed
   * The array is used to keep the order of the entries, and this set is used to quickly check if an entryId is in the feed
   */

  internal_feedId2entryIdSet: Record<FeedId, Set<EntryId>>
  starIds: Set<EntryId>

  readHistory: Record<EntryId, Omit<EntryReadHistoriesModel, "entryId">>
}

export interface EntryFilter {
  unread?: boolean
  view?: FeedViewType
  excludePrivate?: boolean
}
