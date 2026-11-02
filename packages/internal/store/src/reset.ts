import type { Resetable } from "./lib/base"
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
import { userActions } from "./modules/user/store"
import { clearAccountInSession } from "./sync/account"
import { syncEngine } from "./sync/sync-engine"
import { transactionQueue } from "./sync/transaction-queue"

const resets: Resetable[] = [
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
  transactionQueue,
  syncEngine,
  // The owner of the local data is stored with the sync meta, which the engine clears.
  { reset: async () => clearAccountInSession() },
]

export const resetStore = async () => {
  await Promise.all(resets.map((h) => h.reset()))
}
