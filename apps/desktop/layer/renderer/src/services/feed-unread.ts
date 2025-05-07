import { browserDB } from "~/database"
import { feedUnreadActions } from "~/store/unread"

import type { Hydratable } from "./interface"

const feedUnreadModel = browserDB.feedUnreads
class ServiceStatic implements Hydratable {
  updateFeedUnread(list: [string, number][]) {
    return feedUnreadModel.bulkPut(list.map(([feedId, count]) => ({ id: feedId, count })))
  }

  getAll() {
    return feedUnreadModel.toArray() as Promise<
      {
        id: string
        count: number
      }[]
    >
  }

  clear() {
    return feedUnreadModel.clear()
  }

  async bulkDelete(ids: string[]) {
    return feedUnreadModel.bulkDelete(ids)
  }

  async hydrate() {
    const unread = await FeedUnreadService.getAll()

    return feedUnreadActions.hydrate(unread)
  }
}

export const FeedUnreadService = new ServiceStatic()
