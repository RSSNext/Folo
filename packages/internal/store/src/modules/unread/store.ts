import type { FeedViewType } from "@follow/constants"
import type { UnreadSchema } from "@follow/database/schemas/types"
import { EntryService } from "@follow/database/services/entry"
import { UnreadService } from "@follow/database/services/unread"
import { isEqual } from "es-toolkit"

import { apiClient } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createTransaction, createZustandStore } from "../../lib/helper"
import { getEntry } from "../entry/getter"
import { entryActions } from "../entry/store"
import { setFeedUnreadDirty } from "../feed/hooks"
import { getListFeedIds } from "../list/getters"
import { getSubscribedFeedIdAndInboxHandlesByView } from "../subscription/getter"
import type {
  FeedIdOrInboxHandle,
  InsertedBeforeTimeRangeFilter,
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

    if (isEqual(res.data, get().data)) {
      return res.data
    }

    await unreadActions.upsertMany(res.data, { reset: true })
    return res.data
  }

  private async updateUnreadStatus({
    ids,
    time,
    request,
  }: {
    ids: FeedIdOrInboxHandle[]
    time?: PublishAtTimeRangeFilter | InsertedBeforeTimeRangeFilter
    request: () => Promise<UnreadStoreModel>
  }) {
    if (!ids || ids.length === 0) return

    const currentUnreadList = ids.map((id) => ({ id, count: get().data[id] || 0 }))
    const newUnreadListWhenNoTimeFilter = ids.map((id) => ({ id, count: 0 }))

    let affectedEntryIds: string[] = []

    const tx = createTransaction<unknown, unknown, UnreadStoreModel>()

    tx.store(() => {
      affectedEntryIds = entryActions.markEntryReadStatusInSession({
        ids,
        read: true,
        time,
      })

      if (!time) {
        unreadActions.upsertManyInSession(newUnreadListWhenNoTimeFilter)
      }
    })

    tx.request(request)

    tx.rollback(async () => {
      entryActions.markEntryReadStatusInSession({
        entryIds: affectedEntryIds,
        read: false,
      })

      unreadActions.upsertManyInSession(currentUnreadList)
    })

    tx.persist(async (_s, _c, res) => {
      if (!time) {
        await UnreadService.upsertMany(newUnreadListWhenNoTimeFilter)
      } else {
        if (res) {
          await unreadActions.changeBatch(res, "decrement")
        }
      }

      await EntryService.patchMany({
        feedIds: ids,
        entry: { read: true },
        time,
      })
    })

    ids.forEach((id) => {
      if (id) {
        setFeedUnreadDirty(id)
      }
    })

    await tx.run()
  }

  async markBatchAsRead({
    view,
    filter,
    time,
    excludePrivate,
  }: {
    view: FeedViewType | undefined
    filter?: {
      feedId?: string
      listId?: string
      feedIdList?: string[]
      inboxId?: string
      insertedBefore?: number
    } | null
    time?: PublishAtTimeRangeFilter | InsertedBeforeTimeRangeFilter
    excludePrivate: boolean
  }) {
    const request = async () => {
      const res = await apiClient().reads.all.$post({
        json: {
          view,
          excludePrivate,
          ...filter,
          ...time,
        },
      })
      return res.data.read
    }

    if (filter?.feedIdList) {
      await this.updateUnreadStatus({ ids: filter.feedIdList, time, request })
    } else if (filter?.feedId) {
      await this.updateUnreadStatus({ ids: [filter.feedId], time, request })
    } else if (filter?.listId) {
      const feedIds = getListFeedIds(filter.listId)
      if (feedIds && feedIds.length > 0) {
        await this.updateUnreadStatus({ ids: feedIds, time, request })
      }
    } else if (filter?.inboxId) {
      await this.updateUnreadStatus({ ids: [filter.inboxId], time, request })
    } else {
      const feedIdAndInboxHandles = getSubscribedFeedIdAndInboxHandlesByView({
        view,
        excludePrivate,
        excludeHidden: true,
      })
      await this.updateUnreadStatus({ ids: feedIdAndInboxHandles, time, request })
    }
  }

  async markViewAsRead(view: FeedViewType, excludePrivate: boolean) {
    await this.markBatchAsRead({
      view,
      excludePrivate,
    })
  }

  async markFeedAsRead(feedId: string | string[], time?: PublishAtTimeRangeFilter) {
    const feedIds = Array.isArray(feedId) ? feedId : [feedId]

    await this.markBatchAsRead({
      view: undefined,
      excludePrivate: false,
      filter: {
        feedIdList: feedIds,
      },
      time,
    })
  }

  async markListAsRead(listId: string, time?: PublishAtTimeRangeFilter) {
    await this.markBatchAsRead({
      view: undefined,
      excludePrivate: false,
      filter: {
        listId,
      },
      time,
    })
  }

  private async markEntryReadStatus({ entryId, read }: { entryId: string; read: boolean }) {
    const entry = getEntry(entryId)
    if (!entry || entry.read === read || (!entry.feedId && !entry.inboxHandle)) return

    const id: FeedIdOrInboxHandle = entry.inboxHandle || entry.feedId || ""
    const isInbox = !!entry.inboxHandle

    const tx = createTransaction()
    tx.store(() => {
      entryActions.markEntryReadStatusInSession({ entryIds: [entryId], read })
      if (read) {
        unreadActions.removeUnread(id)
      } else {
        unreadActions.addUnread(id)
      }
    })

    tx.request(async () => {
      if (read) {
        await apiClient().reads.$post({
          json: { entryIds: [entryId], isInbox },
        })
      } else {
        await apiClient().reads.$delete({
          json: { entryId, isInbox },
        })
      }
    })

    tx.rollback(() => {
      entryActions.markEntryReadStatusInSession({ entryIds: [entryId], read: !read })
      if (read) {
        unreadActions.addUnread(id)
      } else {
        unreadActions.removeUnread(id)
      }
    })

    tx.persist(() => {
      return EntryService.patchMany({
        entry: { read },
        entryIds: [entryId],
      })
    })

    if (entry.feedId) {
      setFeedUnreadDirty(entry.feedId)
    }
    await tx.run()
  }

  async markEntryAsRead(entryId: string) {
    return this.markEntryReadStatus({ entryId, read: true })
  }

  async markEntryAsUnread(entryId: string) {
    return this.markEntryReadStatus({ entryId, read: false })
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
    this.upsertMany([{ id, count: Math.max(0, cur - count) }])
    return cur
  }

  incrementById(id: FeedIdOrInboxHandle, count: number) {
    return count > 0 ? this.addUnread(id, count) : this.removeUnread(id, -count)
  }

  async updateById(id: FeedIdOrInboxHandle | undefined | null, count: number) {
    if (!id) return
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
