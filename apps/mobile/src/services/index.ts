import { FeedService } from "./feed"
import { InboxService } from "./inbox"
import type { Hydratable } from "./internal/base"
import { ListService } from "./list"
import { SubscriptionService } from "./subscription"
import { UnreadService } from "./unread"

const hydrates: Hydratable[] = [
  FeedService,
  SubscriptionService,
  InboxService,
  ListService,
  UnreadService,
]

export const hydrateDatabaseToStore = async () => {
  await Promise.all(hydrates.map((h) => h.hydrate()))
}
