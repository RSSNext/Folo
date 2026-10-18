import { initializeDB, migrateDB } from "@follow/database/db"

import type { Hydratable } from "./lib/base"
import { actionActions } from "./modules/action/store"
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
import { whoami } from "./modules/user/getters"
import { userActions } from "./modules/user/store"
import { loadLocalDataOwner } from "./sync/account"
import { syncEngine } from "./sync/sync-engine"
import { transactionQueue } from "./sync/transaction-queue"

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
  actionActions,
]

export const hydrateDatabaseToStore = async (options?: { migrateDatabase?: boolean }) => {
  if (options?.migrateDatabase) {
    await initializeDB()
    await migrateDB()
  }
  await Promise.all(hydrates.map((h) => h.hydrate()))
  // Before the outbox: its changes belong to this account and are only sent with its session.
  await loadLocalDataOwner(whoami()?.id)
  // Replay mutations that were recorded but not acknowledged by the server before the last exit.
  await transactionQueue.restore()
  // Pull the changes recorded on the server since the last session.
  await syncEngine.start()
}
