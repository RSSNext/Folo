import type { FeedViewType } from "@follow/constants"
import type { UnreadSchema } from "@follow/database/schemas/types"
import { EntryService } from "@follow/database/services/entry"
import { UnreadService } from "@follow/database/services/unread"

import { apiClient } from "../context"
import { getEntry } from "../entry/getter"
import { entryActions } from "../entry/store"
import type { Hydratable, Resetable } from "../internal/base"
import { createTransaction, createZustandStore } from "../internal/helper"
import { getList, getListFeedIds } from "../list/getters"
import { getSubscriptionByView } from "../subscription/getter"
import type {
  FeedIdOrInboxHandle,
  PublishAtTimeRangeFilter,
  UnreadState,
  UnreadStoreModel,
  UnreadUpdateOptions,
} from "./types"

const initialUnreadStore: UnreadState = {
  data: {},
}

export const useUnreadStore = createZustandStore<UnreadState>("unread")(() => initialUnreadStore)
const get = useUnreadStore.getState
const set = useUnreadStore.setState

class UnreadSyncService {
  async resetFromRemote() {
    const res = await apiClient().reads.$get({
      query: {},
    })

    await unreadActions.upsertMany(res.data, { reset: true })
    return res.data
  }

  private async updateUnreadStatus(feedIds: string[], time?: PublishAtTimeRangeFilter) {
    if (time) {
      await this.resetFromRemote()
    } else {
      await unreadActions.upsertMany(feedIds.map((id) => ({ id, count: 0 })))
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
    excludePrivate,
  }: {
    view: FeedViewType
    filter?: {
      feedId?: string
      listId?: string
      feedIdList?: string[]
      inboxId?: string
    } | null
    time?: PublishAtTimeRangeFilter
    excludePrivate: boolean
  }) {
    await apiClient().reads.all.$post({
      json: {
        view,
        excludePrivate,
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

    await apiClient().reads.all.$post({
      json: {
        feedIdList: feedIds,
        ...time,
      },
    })

    this.updateUnreadStatus(feedIds, time)
  }

  async markListAsRead(listId: string, time?: PublishAtTimeRangeFilter) {
    const list = getList(listId)
    if (!list) return

    await apiClient().reads.all.$post({
      json: {
        listId,

        ...time,
      },
    })

    const feedIds = getListFeedIds(listId)
    if (feedIds) {
      this.updateUnreadStatus(feedIds, time)
    }
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
      apiClient().reads.$post({
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
      apiClient().reads.$delete({
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

class UnreadActions implements Hydratable, Resetable {
  async hydrate() {
    const unreads = await UnreadService.getUnreadAll()
    this.upsertManyInSession(unreads)
  }

  upsertManyInSession(unreads: UnreadSchema[], options?: UnreadUpdateOptions) {
    const state = useUnreadStore.getState()
    const nextData = options?.reset ? {} : { ...state.data }
    for (const unread of unreads) {
      nextData[unread.id] = unread.count
    }
    set({
      data: nextData,
    })
  }

  async upsertMany(unreads: UnreadSchema[] | UnreadStoreModel, options?: UnreadUpdateOptions) {
    const normalizedUnreads = Array.isArray(unreads)
      ? unreads
      : Object.entries(unreads).map(([id, count]) => ({ id, count }))

    const tx = createTransaction()
    tx.store(() => this.upsertManyInSession(normalizedUnreads, options))
    tx.persist(() => UnreadService.upsertMany(normalizedUnreads, options))
    await tx.run()
  }

  async changeBatch(updates: UnreadStoreModel, type: "decrement" | "increment") {
    const state = useUnreadStore.getState()
    const dataToUpsert = Object.entries(updates).map(([id, count]) => {
      const currentCount = state.data[id] || 0
      return {
        id,
        count: type === "increment" ? currentCount + count : Math.max(0, currentCount - count),
      }
    })
    await this.upsertMany(dataToUpsert)
  }

  addUnread(id: FeedIdOrInboxHandle, count = 1) {
    const state = useUnreadStore.getState()
    const cur = state.data[id] ?? 0
    if (count <= 0) return cur
    this.upsertMany([{ id, count: cur + count }])
    return cur
  }

  removeUnread(id: FeedIdOrInboxHandle, count = 1) {
    const state = useUnreadStore.getState()
    const cur = state.data[id] ?? 0
    if (count <= 0) return cur
    return this.upsertMany([{ id, count: Math.max(0, cur - count) }])
  }

  incrementById(id: FeedIdOrInboxHandle, count: number) {
    return count > 0 ? this.addUnread(id, count) : this.removeUnread(id, -count)
  }

  async updateById(id: FeedIdOrInboxHandle, count: number) {
    const state = useUnreadStore.getState()
    const cur = state.data[id] ?? 0
    if (cur === count) return
    await this.upsertMany([{ id, count }])
  }

  subscribeUnreadCount(fn: (count: number) => void, immediately?: boolean) {
    const handler = (state: UnreadState): void => {
      let unread = 0
      for (const key in state.data) {
        unread += state.data[key] ?? 0
      }

      fn(unread)
    }
    if (immediately) {
      handler(get())
    }
    return useUnreadStore.subscribe(handler)
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(initialUnreadStore)
    })

    tx.persist(() => {
      return UnreadService.reset()
    })

    await tx.run()
  }
}
export const unreadActions = new UnreadActions()
export const unreadSyncService = new UnreadSyncService()
