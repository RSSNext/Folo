import type { FeedViewType } from "@follow/constants"
import type {
  CombinedEntryModel,
  EntryModel,
  EntryReadHistoriesModel,
  FeedModel,
  FeedOrListRespModel,
  InboxModel,
} from "@follow/models/types"
import { omitObjectUndefinedValue, omitShallow } from "@follow/utils/utils"
import { isNil, merge } from "es-toolkit/compat"
import { produce } from "immer"

import { clearAllFeedUnreadDirty, clearFeedUnreadDirty, setFeedUnreadDirty } from "~/atoms/feed"
import { runTransactionInScope } from "~/database"
import { apiClient } from "~/lib/api-fetch"
import { getEntriesParams } from "~/lib/utils"
import { EntryService } from "~/services/entry"

import { feedActions } from "../feed"
import { imageActions } from "../image"
import { inboxActions } from "../inbox"
import { getSubscriptionByFeedId } from "../subscription"
import { feedUnreadActions } from "../unread"
import { createTransaction, createZustandStore } from "../utils/helper"
import { internal_batchMarkRead } from "./helper"
import type { EntryState, FlatEntryModel } from "./types"

const createState = (): EntryState => ({
  entries: {},
  flatMapEntries: {},
  internal_feedId2entryIdSet: {},
  starIds: new Set(),
  readHistory: {},
})

export const useEntryStore = createZustandStore<EntryState>("entry")(() => ({
  ...createState(),
}))

const get = useEntryStore.getState
const set = useEntryStore.setState
class EntryActions {
  clear() {
    set(createState)
  }

  clearByFeedId(feedId: string) {
    const entryIds = get().entries[feedId]

    if (!entryIds) return
    set((state) =>
      produce(state, (draft) => {
        entryIds.forEach((entryId) => {
          delete draft.flatMapEntries[entryId]
        })
        delete draft.entries[feedId]
        delete draft.internal_feedId2entryIdSet[feedId]
      }),
    )
    runTransactionInScope(() => EntryService.deleteEntries(entryIds))
  }

  updateEntryContent(entryId: string, content: string) {
    set((state) =>
      produce(state, (draft) => {
        if (!draft.flatMapEntries[entryId]) return
        draft.flatMapEntries[entryId].entries.content = content
      }),
    )
  }

  async fetchEntryById(entryId: string) {
    const { data } = await apiClient.entries.$get({
      query: {
        id: entryId,
      },
    })
    if (data) {
      // @ts-expect-error
      // patch data, should omit `read` because the network race condition or server cache
      const { read, ...nextData } = data
      this.upsertMany([nextData as any])
      feedActions.upsertMany([nextData.feeds])
    }

    return data
  }

  async fetchInboxEntryById(entryId: string) {
    const { data } = await apiClient.entries.inbox.$get({
      query: {
        id: entryId,
      },
    })
    if (data) {
      // @ts-expect-error
      // patch data, should omit `read` because the network race condition or server cache
      const { feeds, read, ...nextData } = data

      // Data compatibility
      if (data.feeds && !(data as any).inboxes) (nextData as any).inboxes = data.feeds
      this.upsertMany([nextData as any])
      inboxActions.upsertMany([(nextData as any).inboxes])
    }

    return data
  }

  async fetchEntries({
    feedId,
    inboxId,
    listId,
    view,
    read,
    limit,
    pageParam,
  }: {
    feedId?: number | string
    inboxId?: number | string
    listId?: number | string
    view?: number
    read?: boolean
    limit?: number
    pageParam?: string
  }) {
    if (inboxId) {
      const data = await apiClient.entries.inbox
        .$post({
          json: {
            publishedAfter: pageParam,
            limit,
            inboxId: `${inboxId}`,
            read,
          },
        })
        .then((res) => {
          return {
            ...res,
            data: res.data?.map(({ feeds, ...d }) => {
              return {
                ...d,
                inboxes: feeds,
              }
            }),
          }
        })

      if (data.data) {
        this.upsertMany(structuredClone(data.data))
      }
      return data
    }

    const params = getEntriesParams({
      feedId,
      inboxId,
      listId,
      view,
    })
    const data = await apiClient.entries.$post({
      json: {
        publishedAfter: pageParam,
        read,
        limit,
        ...params,
      },
    })

    // Mark feed unread dirty, so re-fetch the unread data when view feed unread entires in the next time
    if (read === false) {
      if (typeof params.view === "number" && !params.feedId) {
        clearAllFeedUnreadDirty()
      }
      if (params.feedId) {
        clearFeedUnreadDirty(params.feedId as string)
      }
      if (params.feedIdList) {
        params.feedIdList.forEach((feedId) => {
          clearFeedUnreadDirty(feedId)
        })
      }
    }
    if (data.data) {
      this.upsertMany(structuredClone(data.data))
    }
    return data
  }

  getFlattenMapEntries() {
    return get().flatMapEntries
  }

  private patch(entryId: string, changed: Partial<CombinedEntryModel>) {
    set((state) =>
      produce(state, (draft) => {
        const entry = draft.flatMapEntries[entryId]
        if (!entry) return
        Object.assign(entry, omitObjectUndefinedValue(changed))

        return draft
      }),
    )
  }

  patchManyByFeedId(
    feedId: string,
    changed: Partial<CombinedEntryModel>,
    filter?: {
      startTime: number
      endTime: number
    },
  ) {
    const patchChangedEntriesInDb = [] as {
      key: string
      changes: Partial<EntryModel>
    }[]

    const changedReadStatusMap = {} as Record<string, boolean>

    // TODO collection patch in db

    set((state) =>
      produce(state, (draft) => {
        const ids = draft.entries[feedId]
        if (!ids) return

        ids.forEach((entryId) => {
          if (filter) {
            const entry = draft.flatMapEntries[entryId]!
            if (
              +new Date(entry.entries.publishedAt) < filter.startTime ||
              +new Date(entry.entries.publishedAt) > filter.endTime
            ) {
              return
            }
          }
          Object.assign(draft.flatMapEntries[entryId]!, changed)

          if (changed.entries) {
            patchChangedEntriesInDb.push({
              key: entryId,
              changes: changed.entries,
            })
          }

          if (!isNil(changed.read)) {
            // EntryService.bulkStoreReadStatus()
            changedReadStatusMap[entryId] = changed.read
          }
        })

        return draft
      }),
    )
    runTransactionInScope(() => {
      if (patchChangedEntriesInDb.length > 0) {
        EntryService.bulkPatch(patchChangedEntriesInDb)
      }

      EntryService.bulkStoreReadStatus(changedReadStatusMap)
    })
  }

  upsertMany(data: CombinedEntryModel[]) {
    const feeds = [] as FeedOrListRespModel[]
    const entries = [] as EntryModel[]
    const inboxes = [] as InboxModel[]
    const entry2Read = {} as Record<string, boolean>
    const entryFeedMap = {} as Record<string, string>
    const entryCollection = {} as Record<string, any>

    set((state) =>
      produce(state, (draft) => {
        for (const item of data) {
          const mergedEntry = Object.assign(
            {},
            state.flatMapEntries[item.entries.id]?.entries || {},
            item.entries,
          )

          // Is related to feed
          if (item.feeds) {
            if (!draft.entries[item.feeds.id]) {
              draft.entries[item.feeds.id] = []
            }

            if (!draft.internal_feedId2entryIdSet[item.feeds.id]) {
              draft.internal_feedId2entryIdSet[item.feeds.id] = new Set()
            }

            if (!draft.internal_feedId2entryIdSet[item.feeds.id]!.has(item.entries.id)) {
              draft.entries[item.feeds.id]!.push(item.entries.id)
              draft.internal_feedId2entryIdSet[item.feeds.id]!.add(item.entries.id)
            }

            draft.flatMapEntries[item.entries.id] = Object.assign(
              {},
              draft.flatMapEntries[item.entries.id] || {},
              {
                feedId: item.feeds.id,
                entries: mergedEntry,
              },
              omitShallow(item, "feeds"),
            )

            // Push feed
            feeds.push(item.feeds)
            // Push entryFeedMap
            entryFeedMap[item.entries.id] = item.feeds.id
          }

          // Is related to inbox
          if (item.inboxes) {
            const inboxId = `inbox-${item.inboxes.id}`
            if (!draft.entries[inboxId]) {
              draft.entries[inboxId] = []
            }

            if (!draft.internal_feedId2entryIdSet[inboxId]) {
              draft.internal_feedId2entryIdSet[inboxId] = new Set()
            }

            if (!draft.internal_feedId2entryIdSet[inboxId].has(item.entries.id)) {
              draft.entries[inboxId].push(item.entries.id)
              draft.internal_feedId2entryIdSet[inboxId].add(item.entries.id)
            }

            draft.flatMapEntries[item.entries.id] = merge(
              draft.flatMapEntries[item.entries.id] || {},
              {
                inboxId: item.inboxes.id,
                entries: mergedEntry,
              },
              omitShallow(item, "inboxes"),
            )

            // Push entryFeedMap
            entryFeedMap[item.entries.id] = inboxId

            inboxes.push(item.inboxes)
          }

          // Push entry
          entries.push(mergedEntry)
          // Push entry2Read
          if (!isNil(item.read)) {
            entry2Read[item.entries.id] = item.read
          }

          // Push entryCollection
          if ("collections" in item) {
            entryCollection[item.entries.id] = item.collections
          }

          if (item.entries.media) {
            for (const media of item.entries.media) {
              if (!media.height || !media.width) continue
              imageActions.saveImages([
                {
                  src: media.url,
                  width: media.width,
                  height: media.height,
                  ratio: media.width / media.height,
                  blurhash: media.blurhash,
                },
              ])
            }
          }

          if (item.settings && draft.flatMapEntries[item.entries.id]) {
            draft.flatMapEntries[item.entries.id]!.settings = item.settings
          }
        }

        return draft
      }),
    )
    // Insert to feed store
    feedActions.upsertMany(feeds as FeedModel[])
    inboxActions.upsertMany(inboxes)
    const newStarIds = new Set(get().starIds)
    for (const entryId in entryCollection) {
      newStarIds.add(entryId)
    }
    set((state) => ({
      ...state,
      starIds: newStarIds,
    }))

    // Update database
    runTransactionInScope(() =>
      Promise.all([
        EntryService.upsertMany(entries, entryFeedMap),
        EntryService.bulkStoreReadStatus(entry2Read),
        EntryService.bulkStoreCollection(entryCollection),
      ]),
    )
  }

  hydrate(data: FlatEntryModel[]) {
    const entryCollection = {} as Record<string, any>

    set((state) =>
      produce(state, (draft) => {
        for (const item of data) {
          if (!draft.entries[item.feedId]) {
            draft.entries[item.feedId] = []
          }

          if (!draft.internal_feedId2entryIdSet[item.feedId]) {
            draft.internal_feedId2entryIdSet[item.feedId] = new Set()
          }

          if (!draft.internal_feedId2entryIdSet[item.feedId]!.has(item.entries.id)) {
            draft.entries[item.feedId]!.push(item.entries.id)
            draft.internal_feedId2entryIdSet[item.feedId]!.add(item.entries.id)
          }

          draft.flatMapEntries[item.entries.id] = merge(
            draft.flatMapEntries[item.entries.id] || {},
            item,
          )

          // Push entryCollection
          if ("collections" in item) {
            entryCollection[item.entries.id] = item.collections
          }
        }

        return draft
      }),
    )

    const newStarIds = new Set(get().starIds)
    for (const entryId in entryCollection) {
      newStarIds.add(entryId)
    }
    set((state) => ({
      ...state,
      starIds: newStarIds,
    }))
  }

  async markRead({ feedId, entryId, read }: { feedId: string; entryId: string; read: boolean }) {
    if (!feedId || !entryId) {
      return
    }
    const entry = get().flatMapEntries[entryId]
    const isInbox = !!(entry?.entries && "inboxHandle" in entry.entries)
    const subscription = getSubscriptionByFeedId(feedId)
    if (read && entry?.read) {
      return
    }

    const tx = createTransaction<unknown, { prevUnread: number }>({})

    tx.optimistic((_, ctx) => {
      const prevUnread = feedUnreadActions.incrementByFeedId(feedId, read ? -1 : 1)!
      ctx.prevUnread = prevUnread

      this.patch(entryId, {
        read,
      })
    })
    tx.execute(async (_) => {
      if (read) {
        await internal_batchMarkRead({
          entryId,
          isInbox,
          isPrivate: subscription?.isPrivate,
        })
      } else {
        await apiClient.reads.$delete({
          json: {
            entryId,
            isInbox,
          },
        })
      }
    })

    tx.persist(() => {
      EntryService.bulkStoreReadStatus({
        [entryId]: read,
      })
    })

    tx.rollback((_, ctx) => {
      feedUnreadActions.updateByFeedId(feedId, ctx.prevUnread)
      this.patch(entryId, {
        read: !read,
      })
    })

    await tx.run()

    setFeedUnreadDirty(feedId)
  }

  async markStar(entryId: string, star: boolean, view?: FeedViewType) {
    const tx = createTransaction<unknown, { prevIsStar: boolean }>({})

    tx.optimistic((_, ctx) => {
      ctx.prevIsStar = !!get().flatMapEntries[entryId]?.collections?.createdAt
      this.patch(entryId, {
        collections: star
          ? {
              createdAt: new Date().toISOString(),
            }
          : (null as unknown as undefined),
      })

      set((state) =>
        produce(state, (state) => {
          star ? state.starIds.add(entryId) : state.starIds.delete(entryId)
        }),
      )
    })
    tx.execute(async () => {
      if (star) {
        await apiClient.collections.$post({
          json: {
            entryId,
            view,
          },
        })
      } else {
        await apiClient.collections.$delete({
          json: {
            entryId,
          },
        })
      }
    })

    tx.rollback((_, ctx) => {
      set((state) =>
        produce(state, (state) => {
          ctx.prevIsStar ? state.starIds.add(entryId) : state.starIds.delete(entryId)
        }),
      )
      this.patch(entryId, {
        collections: ctx.prevIsStar
          ? {
              createdAt: new Date().toISOString(),
            }
          : (null as unknown as undefined),
      })
    })

    tx.persist(async () => {
      if (star) {
        await EntryService.bulkStoreCollection({
          [entryId]: {
            createdAt: new Date().toISOString(),
          },
        })
      } else {
        await EntryService.deleteCollection(entryId)
      }
    })

    await tx.run()
  }

  updateReadHistory(entryId: string, readHistory: Omit<EntryReadHistoriesModel, "entryId">) {
    set((state) => ({
      ...state,
      readHistory: {
        ...state.readHistory,
        [entryId]: readHistory,
      },
    }))
  }

  async deleteInboxEntry(entryId: string) {
    const entry = get().flatMapEntries[entryId]
    if (!entry) return
    const tx = createTransaction(entry, {
      deletedIndex: -1,
    })

    tx.optimistic((entry, ctx) => {
      const { inboxId, read } = entry
      const fullInboxId = `inbox-${inboxId}`

      if (!read) {
        feedUnreadActions.incrementByFeedId(inboxId, -1)
      }

      set((state) => {
        const nextFlatMapEntries = { ...state.flatMapEntries }

        delete nextFlatMapEntries[entryId]

        const index = state.entries[fullInboxId]!.indexOf(entryId)

        const nextState = {
          ...state,
          flatMapEntries: nextFlatMapEntries,
        }
        if (index !== -1) {
          ctx.deletedIndex = index

          const nextFeedEntries = {
            ...state.entries,

            [fullInboxId]: state.entries[fullInboxId]!.filter((id) => id !== entryId),
          }

          nextState.entries = nextFeedEntries
        }

        return nextState
      })
    })

    tx.execute(async () => {
      await apiClient.entries.inbox.$delete({ json: { entryId } })
    })

    tx.persist(async () => {
      await EntryService.deleteEntries([entryId])
    })

    tx.rollback((entry, ctx) => {
      const { inboxId, read } = entry
      if (!read) {
        feedUnreadActions.incrementByFeedId(inboxId, 1)
      }

      set((state) => ({
        ...state,
        entries: {
          ...state.entries,
          [entry.feedId]: state.entries[entry.feedId]!.splice(ctx.deletedIndex, 0, entryId),
        },
        flatMapEntries: {
          ...state.flatMapEntries,
          [entryId]: entry,
        },
      }))
    })

    await tx.run()
  }
}

export const entryActions = new EntryActions()

export const getEntry = (entryId: string) => useEntryStore.getState().flatMapEntries[entryId]
