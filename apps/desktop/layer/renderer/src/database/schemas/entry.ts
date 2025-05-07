import type { EntryModel } from "@follow/models/types"

export type DB_Entry = EntryModel & { feedId: string }

export type DB_EntryRelated = {
  id: string
  data: any
}
