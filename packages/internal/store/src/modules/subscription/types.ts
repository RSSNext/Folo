import type { FeedViewType } from "@follow/constants"
import type { SubscriptionSchema } from "@follow/database/schemas/types"

type Nullable<T> = T | null | undefined

export interface SubscriptionForm {
  url: string | undefined
  view: FeedViewType
  category: Nullable<string>
  isPrivate: boolean
  hideFromTimeline: Nullable<boolean>
  title: Nullable<string>
  feedId: Nullable<string>
  listId: string | undefined
}

export type SubscriptionModel = Omit<SubscriptionSchema, "id">
