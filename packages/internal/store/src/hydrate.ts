import { initializeDB, migrateDB } from "@follow/database/db"

import type { Hydratable } from "./lib/base"
import { collectionActions } from "./modules/collection/store"
import { entryActions } from "./modules/entry/store"
import { feedActions } from "./modules/feed/store"
import { imageActions } from "./modules/image/store"
import { inboxActions } from "./modules/inbox/store"
import { listActions } from "./modules/list/store"
import { subscriptionActions } from "./modules/subscription/store"
import { summaryActions } from "./modules/summary/store"
import { translationActions } from "./modules/translation/store"
import { unreadActions } from "./modules/unread/store"
import { userActions } from "./modules/user/store"

const hydrates: Hydratable[] = [
  feedActions,
  subscriptionActions,
  inboxActions,
  listActions,
  unreadActions,
  userActions,
  entryActions,
  collectionActions,
  summaryActions,
  translationActions,
  imageActions,
]

export const hydrateDatabaseToStore = async (options?: { migrateDatabase?: boolean }) => {
  if (options?.migrateDatabase) {
    await initializeDB()
    await migrateDB()
  }
  await Promise.all(hydrates.map((h) => h.hydrate()))
}
