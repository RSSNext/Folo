import { collectionActions } from "./collection/store"
import { entryActions } from "./entry/store"
import { feedActions } from "./feed/store"
import { imageActions } from "./image/store"
import { inboxActions } from "./inbox/store"
import type { Hydratable } from "./internal/base"
import { listActions } from "./list/store"
import { subscriptionActions } from "./subscription/store"
import { translationActions } from "./translation/store"
import { unreadActions } from "./unread/store"
import { userActions } from "./user/store"

/// keep-sorted
const hydrates: Hydratable[] = [
  collectionActions,
  entryActions,
  feedActions,
  imageActions,
  inboxActions,
  listActions,
  subscriptionActions,
  translationActions,
  unreadActions,
  userActions,
]

export const hydrateDatabaseToStore = async () => {
  await Promise.all(hydrates.map((h) => h.hydrate()))
}
