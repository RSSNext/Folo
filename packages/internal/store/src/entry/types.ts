import type { EntrySchema } from "@follow/database/schemas/types"

export type EntryModel = EntrySchema
export type FetchEntriesProps = {
  feedId?: string
  feedIdList?: string[]
  inboxId?: string
  listId?: string
  view?: number
  read?: boolean
  limit?: number
  pageParam?: string
  isCollection?: boolean
  excludePrivate?: boolean
}

export type FetchEntriesPropsSettings = {
  hidePrivateSubscriptionsInTimeline: boolean
  unreadOnly: boolean
}
