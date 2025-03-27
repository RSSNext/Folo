import type { EntrySchema } from "@/src/database/schemas/types"

import type { EntryTranslation } from "../translation/types"

export type EntryModel = EntrySchema
export type EntryWithTranslation = EntryModel & { translation?: EntryTranslation }
export type FetchEntriesProps = {
  feedId?: number | string
  inboxId?: number | string
  listId?: number | string
  view?: number
  read?: boolean
  limit?: number
  pageParam?: string
  isCollection?: boolean
}
