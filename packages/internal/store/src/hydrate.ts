import { initializeDb, migrateDb } from "@follow/database/db"

import { collectionActions } from "./collection/store"
import { entryActions } from "./entry/store"
import { feedActions } from "./feed/store"
import { inboxActions } from "./inbox/store"
import type { Hydratable } from "./internal/base"
import { listActions } from "./list/store"
import { subscriptionActions } from "./subscription/store"
import { translationActions } from "./translation/store"
import { unreadActions } from "./unread/store"
import { userActions } from "./user/store"

const hydrates: Hydratable[] = [
  feedActions,
  subscriptionActions,
  inboxActions,
  listActions,
  unreadActions,
  userActions,
  entryActions,
  collectionActions,
  translationActions,
]

export const hydrateDatabaseToStore = async (options?: { migrateDatabase?: boolean }) => {
  if (options?.migrateDatabase) {
    initializeDb()
    await migrateDb()
  }
  await Promise.all(hydrates.map((h) => h.hydrate()))
}
