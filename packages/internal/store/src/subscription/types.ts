import type { FeedViewType } from "@follow/constants"
import type { SubscriptionSchema } from "@follow/database/schemas/types"

export interface SubscriptionForm {
  url?: string
  view: FeedViewType
  category?: string
  isPrivate: boolean
  title?: string | null
  feedId?: string
  listId?: string
}

export type SubscriptionModel = Omit<SubscriptionSchema, "id">
