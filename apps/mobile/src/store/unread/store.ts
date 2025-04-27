import type { FeedViewType } from "@follow/constants"

import type { UnreadSchema } from "@/src/database/schemas/types"
import { apiClient } from "@/src/lib/api-fetch"
import { setBadgeCountAsyncWithPermission } from "@/src/lib/permission"
import { EntryService } from "@/src/services/entry"
import { UnreadService } from "@/src/services/unread"

import { getEntry } from "../entry/getter"
import { entryActions } from "../entry/store"
import { createTransaction, createZustandStore } from "../internal/helper"
import { getListFeedIds } from "../list/getters"
import { getSubscriptionByView } from "../subscription/getter"
import { getAllUnreadCount } from "./getter"
import type { PublishAtTimeRangeFilter } from "./types"

type SubscriptionId = string
interface UnreadStore {
  data: Record<SubscriptionId, number>
}
export const useUnreadStore = createZustandStore<UnreadStore>("unread")(() => ({
  data: {},
}))
const set = useUnreadStore.setState

class UnreadSyncService {
  async resetFromRemote() {
    const res = await apiClient.reads.$get({
      query: {},
    })

    await unreadActions.reset()
    await unreadActions.upsertMany(res.data)
    return res.data
  }

  async updateBadgeAtBackground() {
    await this.resetFromRemote()
    const allUnreadCount = getAllUnreadCount()
    setBadgeCountAsyncWithPermission(allUnreadCount)
    return true
  }

  private async updateUnreadStatus(feedIds: string[], time?: PublishAtTimeRangeFilter) {
    if (time) {
      await this.resetFromRemote()
    } else {
      await unreadActions.upsertMany(feedIds.map((id) => ({ subscriptionId: id, count: 0 })))
    }
    entryActions.markEntryReadStatusInSession({ feedIds, read: true, time })
    await EntryService.patchMany({
      feedIds,
      entry: { read: true },
      time,
    })
  }

  async markViewAsRead({
    view,
    filter,
    time,
  }: {
    view: FeedViewType
    filter?: {
      feedId?: string
      listId?: string
      feedIdList?: string[]
      inboxId?: string
    } | null
    time?: PublishAtTimeRangeFilter
  }) {
    await apiClient.reads.all.$post({
      json: {
        view,
        ...filter,
        ...time,
      },
    })
    if (filter?.feedIdList) {
      this.updateUnreadStatus(filter.feedIdList, time)
    } else if (filter?.feedId) {
      this.updateUnreadStatus([filter.feedId], time)
    } else if (filter?.listId) {
      const feedIds = getListFeedIds(filter.listId)
      if (feedIds) {
        this.updateUnreadStatus(feedIds, time)
      }
    } else if (filter?.inboxId) {
      this.updateUnreadStatus([filter.inboxId], time)
    } else {
      const subscriptionIds = getSubscriptionByView(view)
      this.updateUnreadStatus(subscriptionIds, time)
    }
  }

  async markFeedAsRead(feedId: string | string[], time?: PublishAtTimeRangeFilter) {
    const feedIds = Array.isArray(feedId) ? feedId : [feedId]

    await apiClient.reads.all.$post({
      json: {
        feedIdList: feedIds,
        ...time,
      },
    })

    this.updateUnreadStatus(feedIds, time)
  }

  async markEntryAsRead(entryId: string) {
    const entry = getEntry(entryId)
    if (!entry || entry?.read) return

    const feedId = entry?.feedId

    const tx = createTransaction()
    tx.store(() => {
      entryActions.markEntryReadStatusInSession({ entryIds: [entryId], read: true })

      if (feedId) {
        unreadActions.removeUnread(feedId)
      }
    })
    tx.rollback(() => {
      entryActions.markEntryReadStatusInSession({ entryIds: [entryId], read: false })

      if (feedId) {
        unreadActions.addUnread(feedId)
      }
    })

    tx.request(() => {
      apiClient.reads.$post({
        json: { entryIds: [entryId] },
      })
    })

    tx.persist(() => {
      return EntryService.patchMany({
        entry: { read: true },
        entryIds: [entryId],
      })
    })

    await tx.run()
  }

  async markEntryAsUnread(entryId: string) {
    const entry = getEntry(entryId)
    if (!entry || !entry?.read) return

    const feedId = entry?.feedId

    const tx = createTransaction()
    tx.store(() => {
      entryActions.markEntryReadStatusInSession({ entryIds: [entryId], read: false })

      if (feedId) {
        unreadActions.addUnread(feedId)
      }
    })
    tx.rollback(() => {
      entryActions.markEntryReadStatusInSession({ entryIds: [entryId], read: true })

      if (feedId) {
        unreadActions.removeUnread(feedId)
      }
    })

    tx.request(() => {
      apiClient.reads.$delete({
        json: { entryId },
      })
    })

    tx.persist(() => {
      return EntryService.patchMany({
        entry: { read: false },
        entryIds: [entryId],
      })
    })

    await tx.run()
  }
}

class UnreadActions {
  upsertManyInSession(unreads: UnreadSchema[]) {
    const state = useUnreadStore.getState()
    const nextData = { ...state.data }
    for (const unread of unreads) {
      nextData[unread.subscriptionId] = unread.count
    }
    set({
      data: nextData,
    })
  }

  async upsertMany(unreads: UnreadSchema[] | Record<SubscriptionId, number>) {
    const tx = createTransaction()

    const normalizedUnreads = Array.isArray(unreads)
      ? unreads
      : Object.entries(unreads).map(([subscriptionId, count]) => ({ subscriptionId, count }))
    tx.store(() => this.upsertManyInSession(normalizedUnreads))
    tx.persist(() => {
      return UnreadService.upsertMany(normalizedUnreads)
    })
    await tx.run()
  }

  async addUnread(subscriptionId: string, count = 1) {
    const state = useUnreadStore.getState()
    const currentCount = state.data[subscriptionId] || 0
    await unreadActions.upsertMany([{ subscriptionId, count: currentCount + count }])
  }

  async removeUnread(subscriptionId: string, count = 1) {
    const state = useUnreadStore.getState()
    const currentCount = state.data[subscriptionId] || 0
    await unreadActions.upsertMany([{ subscriptionId, count: Math.max(0, currentCount - count) }])
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set({
        data: {},
      })
    })

    tx.persist(() => {
      return UnreadService.reset()
    })

    await tx.run()
  }
}
export const unreadActions = new UnreadActions()
export const unreadSyncService = new UnreadSyncService()
