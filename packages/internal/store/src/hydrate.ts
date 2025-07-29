import { initializeDB, migrateDB } from "@follow/database/db"

import { collectionActions } from "./collection/store"
import { entryActions } from "./entry/store"
import { feedActions } from "./feed/store"
import { imageActions } from "./image/store"
import { inboxActions } from "./inbox/store"
import type { Hydratable } from "./internal/base"
import { listActions } from "./list/store"
import { subscriptionActions } from "./subscription/store"
import { summaryActions } from "./summary/store"
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
