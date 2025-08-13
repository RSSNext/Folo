import type { Resetable } from "./lib/base"
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
]

export const resetStore = async () => {
  await Promise.all(resets.map((h) => h.reset()))
}
