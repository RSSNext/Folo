import type { EntrySchema, SubscriptionSchema } from "@follow/database/src/schemas/types"
import type { EntryModel } from "@follow/store/src/entry/types"
import type { SubscriptionModel } from "@follow/store/src/subscription/store"

class DbStoreMorph {
  toSubscriptionModel(subscription: SubscriptionSchema): SubscriptionModel {
    return subscription
  }

  toEntryModel(entry: EntrySchema): EntryModel {
    return entry
  }
}

export const dbStoreMorph = new DbStoreMorph()
