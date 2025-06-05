import { browserDB } from "~/database"

import type { Hydratable } from "./interface"

const unreadModel = browserDB.feedUnreads
class ServiceStatic implements Hydratable {
  updateUnread(list: [string, number][]) {
    return unreadModel.bulkPut(list.map(([id, count]) => ({ id, count })))
  }

  getAll() {
    return unreadModel.toArray() as Promise<
      {
        id: string
        count: number
      }[]
    >
  }

  clear() {
    return unreadModel.clear()
  }

  async bulkDelete(ids: string[]) {
    return unreadModel.bulkDelete(ids)
  }

  async hydrate() {}
}

export const UnreadService = new ServiceStatic()
