import type { EntrySchema, SubscriptionSchema } from "@follow/database/src/schemas/types"

import type { EntryModel } from "../store/entry/types"
import type { SubscriptionModel } from "../store/subscription/store"

class DbStoreMorph {
  toSubscriptionModel(subscription: SubscriptionSchema): SubscriptionModel {
    return subscription
  }

  toEntryModel(entry: EntrySchema): EntryModel {
    return entry
  }
}

export const dbStoreMorph = new DbStoreMorph()
