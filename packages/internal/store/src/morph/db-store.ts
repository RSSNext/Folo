import type { EntrySchema, SubscriptionSchema } from "@follow/database/schemas/types"

import type { EntryModel } from "../modules/entry/types"
import type { SubscriptionModel } from "../modules/subscription/types"

class DbStoreMorph {
  toSubscriptionModel(subscription: SubscriptionSchema): SubscriptionModel {
    return subscription
  }

  toEntryModel(entry: EntrySchema): EntryModel {
    return {
      ...entry,
      tags: entry.tags ?? null,
    }
  }
}

export const dbStoreMorph = new DbStoreMorph()
