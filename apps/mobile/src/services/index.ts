import { CollectionService } from "./collection"
import { EntryService } from "./entry"
import { FeedService } from "./feed"
import { ImagesService } from "./image"
import { InboxService } from "./inbox"
import type { Hydratable } from "./internal/base"
import { ListService } from "./list"
import { SubscriptionService } from "./subscription"
import { TranslationService } from "./translation"
import { UnreadService } from "./unread"
import { UserService } from "./user"

const hydrates: Hydratable[] = [
  FeedService,
  SubscriptionService,
  InboxService,
  ListService,
  UnreadService,
  UserService,
  EntryService,
  CollectionService,
  ImagesService,
  TranslationService,
]

export const hydrateDatabaseToStore = async () => {
  await Promise.all(hydrates.map((h) => h.hydrate()))
}
