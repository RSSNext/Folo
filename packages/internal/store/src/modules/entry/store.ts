import { FeedViewType } from "@follow/constants"
import { EntryService } from "@follow/database/services/entry"
import { isBizId } from "@follow/utils"
import { cloneDeep } from "es-toolkit"
import { debounce } from "es-toolkit/compat"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { readNdjsonStream } from "../../lib/stream"
import { apiMorph } from "../../morph/api"
import { dbStoreMorph } from "../../morph/db-store"
import { storeDbMorph } from "../../morph/store-db"
import { entryReadOverlayKey } from "../../sync/overlay-keys"
import { transactionQueue } from "../../sync/transaction-queue"
import { collectionActions } from "../collection/store"
import { clearAllFeedUnreadDirty, clearFeedUnreadDirty } from "../feed/hooks"
import { feedActions } from "../feed/store"
import { getSubscriptionById } from "../subscription/getter"
import { getDefaultCategory } from "../subscription/utils"
import type {
  FeedIdOrInboxHandle,
  InsertedBeforeTimeRangeFilter,
  PublishAtTimeRangeFilter,
} from "../unread/types"
import { userActions } from "../user/store"
import { getEntry } from "./getter"
import type { EntryModel, FetchEntriesProps, FetchEntriesPropsSettings } from "./types"
import { getEffectiveEntrySortOrder, getEntriesParams, isTimelineEntriesSource } from "./utils"

type EntryId = string
type FeedId = string
type InboxId = string
type Category = string
type ListId = string

interface EntryState {
  data: Record<EntryId, EntryModel>
  entryIdByView: Record<FeedViewType, Set<EntryId>>
  entryIdByCategory: Record<Category, Set<EntryId>>
  entryIdByFeed: Record<FeedId, Set<EntryId>>
  entryIdByInbox: Record<InboxId, Set<EntryId>>
  entryIdByList: Record<ListId, Set<EntryId>>
  entryIdSet: Set<EntryId>
}

const defaultState: EntryState = {
  data: {},
  entryIdByView: {
    [FeedViewType.All]: new Set(),
    [FeedViewType.Articles]: new Set(),
    [FeedViewType.Audios]: new Set(),
    [FeedViewType.Notifications]: new Set(),
    [FeedViewType.Pictures]: new Set(),
    [FeedViewType.SocialMedia]: new Set(),
    [FeedViewType.Videos]: new Set(),
  },
  entryIdByCategory: {},
  entryIdByFeed: {},
  entryIdByInbox: {},
  entryIdByList: {},
  entryIdSet: new Set(),
}

export const useEntryStore = createZustandStore<EntryState>("entry")(() => defaultState)

const get = useEntryStore.getState
const immerSet = createImmerSetter(useEntryStore)

class EntryActions implements Hydratable, Resetable {
  async hydrate() {
    const entries = await EntryService.getEntriesToHydrate()
    entryActions.upsertManyInSession(entries.map((e) => dbStoreMorph.toEntryModel(e)))
  }

  getFlattenMapEntries() {
    const state = get()
    return state.data
  }

  private addEntryIdToView({
    draft,
    feedId,
    entryId,
    sources,
    hidePrivateSubscriptionsInTimeline,
  }: {
    draft: EntryState
    feedId?: FeedId | null
    entryId: EntryId
    sources?: string[] | null
    hidePrivateSubscriptionsInTimeline?: boolean
  }) {
    if (!feedId) return

    const subscription = getSubscriptionById(feedId)
    const ignore =
      (hidePrivateSubscriptionsInTimeline && subscription?.isPrivate) ||
      subscription?.hideFromTimeline

    if (!ignore) {
      if (typeof subscription?.view === "number") {
        draft.entryIdByView[subscription.view]!.add(entryId)
      }
      draft.entryIdByView[FeedViewType.All]!.add(entryId)
    }

    // lists
    for (const s of sources ?? []) {
      const subscription = getSubscriptionById(s)
      const ignore =
        (hidePrivateSubscriptionsInTimeline && subscription?.isPrivate) ||
        subscription?.hideFromTimeline

      if (!ignore) {
        if (typeof subscription?.view === "number") {
          draft.entryIdByView[subscription.view]!.add(entryId)
        }
        draft.entryIdByView[FeedViewType.All]!.add(entryId)
      }
    }
  }

  private addEntryIdToCategory({
    draft,
    feedId,
    entryId,
  }: {
    draft: EntryState
    feedId?: FeedId | null
    entryId: EntryId
  }) {
    if (!feedId) return
    const subscription = getSubscriptionById(feedId)
    const category = subscription?.category || getDefaultCategory(subscription)
    if (!category) return
    const entryIdSetByCategory = draft.entryIdByCategory[category]
    if (!entryIdSetByCategory) {
      draft.entryIdByCategory[category] = new Set([entryId])
    } else {
      entryIdSetByCategory.add(entryId)
    }
  }

  private addEntryIdToFeed({
    draft,
    feedId,
    entryId,
  }: {
    draft: EntryState
    feedId?: FeedId | null
    entryId: EntryId
  }) {
    if (!feedId) return
    const entryIdSetByFeed = draft.entryIdByFeed[feedId]
    if (!entryIdSetByFeed) {
      draft.entryIdByFeed[feedId] = new Set([entryId])
    } else {
      entryIdSetByFeed.add(entryId)
    }
  }

  private addEntryIdToInbox({
    draft,
    inboxHandle,
    entryId,
  }: {
    draft: EntryState
    inboxHandle?: InboxId | null
    entryId: EntryId
  }) {
    if (!inboxHandle) return
    const entryIdSetByInbox = draft.entryIdByInbox[inboxHandle]
    if (!entryIdSetByInbox) {
      draft.entryIdByInbox[inboxHandle] = new Set([entryId])
    } else {
      entryIdSetByInbox.add(entryId)
    }
  }

  private addEntryIdToList({
    draft,
    listId,
    entryId,
  }: {
    draft: EntryState
    listId?: ListId | null
    entryId: EntryId
  }) {
    if (!listId) return
    const entryIdSetByList = draft.entryIdByList[listId]
    if (!entryIdSetByList) {
      draft.entryIdByList[listId] = new Set([entryId])
    } else {
      entryIdSetByList.add(entryId)
    }
  }

  upsertManyInSession(entries: EntryModel[], options?: FetchEntriesPropsSettings) {
    if (entries.length === 0) return
    const { unreadOnly, hidePrivateSubscriptionsInTimeline } = options || {}

    // Pending or just-acknowledged read marks win over the snapshot we received.
    const overlays = transactionQueue.getOverlays()

    immerSet((draft) => {
      for (const entry of entries) {
        const readOverride = overlays.get(entryReadOverlayKey(entry.id))
        const nextEntry =
          typeof readOverride === "boolean" && entry.read !== readOverride
            ? { ...entry, read: readOverride }
            : entry

        draft.entryIdSet.add(nextEntry.id)
        draft.data[nextEntry.id] = nextEntry

        const { feedId, inboxHandle, read, sources } = nextEntry
        if (unreadOnly && read) continue

        if (inboxHandle) {
          this.addEntryIdToInbox({
            draft,
            inboxHandle,
            entryId: nextEntry.id,
          })
        } else {
          this.addEntryIdToFeed({
            draft,
            feedId,
            entryId: nextEntry.id,
          })
        }

        this.addEntryIdToView({
          draft,
          feedId,
          entryId: nextEntry.id,
          sources,
          hidePrivateSubscriptionsInTimeline,
        })

        this.addEntryIdToCategory({
          draft,
          feedId,
          entryId: nextEntry.id,
        })

        nextEntry.sources
          ?.filter((s) => !!s && s !== "feed")
          .forEach((s) => {
            this.addEntryIdToList({
              draft,
              listId: s,
              entryId: nextEntry.id,
            })
          })
      }
    })
  }

  async upsertMany(entries: EntryModel[]) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(entries)
    })

    tx.persist(() => {
      return EntryService.upsertMany(entries.map((e) => storeDbMorph.toEntrySchema(e)))
    })

    await tx.run()
  }

  updateEntryContentInSession({
    entryId,
    content,
    readabilityContent,
    readabilityUpdatedAt,
  }: {
    entryId: EntryId
    content?: string
    readabilityContent?: string
    readabilityUpdatedAt?: Date
  }) {
    immerSet((draft) => {
      const entry = draft.data[entryId]
      if (!entry) return
      if (content) {
        entry.content = content
      }
      if (readabilityContent) {
        entry.readabilityContent = readabilityContent
        entry.readabilityUpdatedAt = readabilityUpdatedAt
      }
    })
  }

  async updateEntryContent({
    entryId,
    content,
    readabilityContent,
    readabilityUpdatedAt = new Date(),
  }: {
    entryId: EntryId
    content?: string
    readabilityContent?: string
    readabilityUpdatedAt?: Date
  }) {
    const tx = createTransaction()
    tx.store(() => {
      this.updateEntryContentInSession({
        entryId,
        content,
        readabilityContent,
        readabilityUpdatedAt,
      })
    })

    tx.persist(() => {
      if (content) {
        EntryService.patch({ id: entryId, content })
      }

      if (readabilityContent) {
        EntryService.patch({ id: entryId, readabilityContent, readabilityUpdatedAt })
      }
    })

    await tx.run()
  }

  /** Store the contents of several entries in one store update. */
  async updateEntryContents(contents: { entryId: EntryId; content: string }[]) {
    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        for (const { entryId, content } of contents) {
          const entry = draft.data[entryId]
          if (entry && content) {
            entry.content = content
          }
        }
      })
    })

    tx.persist(() => {
      for (const { entryId, content } of contents) {
        if (content) {
          EntryService.patch({ id: entryId, content })
        }
      }
    })

    await tx.run()
  }

  /**
   * Entries whose read flag would change for the given selection, without mutating anything.
   */
  collectEntryIdsToMarkInSession({
    entryIds,
    ids,
    read,
    time,
  }: {
    entryIds?: EntryId[]
    ids?: FeedIdOrInboxHandle[]
    read: boolean
    time?: PublishAtTimeRangeFilter | InsertedBeforeTimeRangeFilter
  }): EntryId[] {
    const state = get()
    const matchesTime = (entry: EntryModel) => {
      if (time && "startTime" in time) {
        const publishedAt = +new Date(entry.publishedAt)
        if (publishedAt < time.startTime || publishedAt > time.endTime) return false
      }
      if (time && "insertedBefore" in time && +new Date(entry.insertedAt) >= time.insertedBefore) {
        return false
      }
      return true
    }

    const affected = new Set<EntryId>()

    if (entryIds) {
      for (const entryId of entryIds) {
        const entry = state.data[entryId]
        if (!entry || !matchesTime(entry)) continue
        if (entry.read !== read) affected.add(entryId)
      }
    }

    if (ids) {
      const idSet = new Set(ids)
      for (const entryId of state.entryIdSet) {
        const entry = state.data[entryId]
        if (!entry) continue
        const id = entry.inboxHandle || entry.feedId || ""
        if (!id || !idSet.has(id) || !matchesTime(entry)) continue
        if (entry.read !== read) affected.add(entryId)
      }
    }

    return Array.from(affected)
  }

  markEntryReadStatusInSession({
    entryIds,
    ids,
    read,
    time,
  }: {
    entryIds?: EntryId[]
    ids?: FeedIdOrInboxHandle[]
    read: boolean
    time?: PublishAtTimeRangeFilter | InsertedBeforeTimeRangeFilter
  }) {
    const affectedEntryIds = this.collectEntryIdsToMarkInSession({ entryIds, ids, read, time })
    if (affectedEntryIds.length === 0) return affectedEntryIds

    immerSet((draft) => {
      for (const entryId of affectedEntryIds) {
        const entry = draft.data[entryId]
        if (entry) {
          entry.read = read
        }
      }
    })

    return affectedEntryIds
  }

  resetByView({ view, entries }: { view?: FeedViewType; entries: EntryModel[] }) {
    if (view === undefined) return
    immerSet((draft) => {
      draft.entryIdByView[view] = new Set(entries.map((e) => e.id))
    })
  }

  resetByCategory({ category, entries }: { category?: Category; entries: EntryModel[] }) {
    if (!category) return
    immerSet((draft) => {
      draft.entryIdByCategory[category] = new Set(entries.map((e) => e.id))
    })
  }

  resetByFeed({ feedId, entries }: { feedId?: FeedId; entries: EntryModel[] }) {
    if (!feedId) return
    immerSet((draft) => {
      draft.entryIdByFeed[feedId] = new Set(entries.map((e) => e.id))
    })
  }

  resetByInbox({ inboxId, entries }: { inboxId?: InboxId; entries: EntryModel[] }) {
    if (!inboxId) return
    immerSet((draft) => {
      draft.entryIdByInbox[inboxId] = new Set(entries.map((e) => e.id))
    })
  }

  resetByList({ listId, entries }: { listId?: ListId; entries: EntryModel[] }) {
    if (!listId) return
    immerSet((draft) => {
      draft.entryIdByList[listId] = new Set(entries.map((e) => e.id))
    })
  }

  deleteInboxEntryById(entryId: EntryId) {
    const entry = get().data[entryId]
    if (!entry || !entry.inboxHandle) return

    immerSet((draft) => {
      delete draft.data[entryId]
      draft.entryIdSet.delete(entryId)
      draft.entryIdByInbox[entry.inboxHandle!]?.delete(entryId)
      draft.entryIdByView[FeedViewType.All]!.delete(entryId)
    })
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      immerSet(() => defaultState)
    })

    tx.persist(() => {
      return EntryService.reset()
    })

    await tx.run()
  }
}

class EntrySyncServices {
  async fetchEntries(props: FetchEntriesProps) {
    const {
      feedId,
      inboxId,
      listId,
      view,
      read,
      limit,
      pageParam,
      isCollection,
      feedIdList,
      excludePrivate,
      aiSort,
      sortOrder,
    } = props
    const params = getEntriesParams({
      feedId,
      inboxId,
      listId,
      view,
      feedIdList,
    })
    const effectiveSortOrder = getEffectiveEntrySortOrder({
      sortOrder: aiSort ? "desc" : sortOrder,
      unreadOnly: read === false,
      isTimelineSource: isTimelineEntriesSource({
        feedId,
        inboxId: params.inboxId,
        isCollection: isCollection === true || params.isCollection === true,
      }),
    })

    const res = params.inboxId
      ? await api().entries.inbox.list({
          publishedAfter: pageParam,
          read,
          limit,
          isCollection,
          inboxId: params.inboxId,
          ...(aiSort && { aiSort }),
          ...params,
        })
      : await api().entries.list(
          {
            ...(effectiveSortOrder === "asc"
              ? { publishedBefore: pageParam }
              : { publishedAfter: pageParam }),
            read,
            limit,
            isCollection,
            excludePrivate,
            ...(aiSort && { aiSort }),
            ...(effectiveSortOrder && { sortOrder: effectiveSortOrder }),
            ...params,
          },
          aiSort
            ? {
                timeout: 3 * 60 * 1000,
              }
            : undefined,
        )

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

    const entries = apiMorph.toEntryList(res.data)
    const entriesInDB = await EntryService.getEntryMany(entries.map((e) => e.id))
    for (const entry of entries) {
      const entryInDB = entriesInDB.find((e) => e.id === entry.id)
      if (entryInDB) {
        entry.content = entryInDB.content
        entry.readabilityContent = entryInDB.readabilityContent
        entry.readabilityUpdatedAt = entryInDB.readabilityUpdatedAt
      }
    }

    await entryActions.upsertMany(entries)

    if (typeof view === "number") {
      const { collections, entryIdsNotInCollections } = apiMorph.toCollections(res.data, view)
      const effectiveLimit = limit !== undefined ? Math.min(limit, 100) : 20
      const shouldResetCollection =
        params.isCollection && !pageParam && entries.length < effectiveLimit
      await collectionActions.reconcileFromRemote({
        collections,
        entryIdsNotInCollections,
        // A full reset is only safe once the first page proves there are no more collection rows.
        reset: shouldResetCollection,
      })
    }

    const dataFeeds = res.data?.map((e) => e.feeds).filter((f) => f.type === "feed")
    const feeds = dataFeeds?.map((f) => apiMorph.toFeed(f)) ?? []
    feedActions.upsertMany(feeds)

    return res
  }

  async fetchEntryDetail(entryId: EntryId | undefined, isInbox?: boolean) {
    if (!isBizId(entryId)) return null

    const currentEntry = getEntry(entryId)
    const res =
      currentEntry?.inboxHandle || isInbox
        ? await api().entries.inbox.get({ id: entryId })
        : await api().entries.get({ id: entryId })
    const entry = apiMorph.toEntry(res.data)
    if (!currentEntry && entry) {
      await entryActions.upsertMany([entry])
    } else {
      if (entry?.content && currentEntry?.content !== entry.content) {
        await entryActions.updateEntryContent({ entryId, content: entry.content })
      }
      if (
        entry?.readabilityContent &&
        currentEntry?.readabilityContent !== entry.readabilityContent
      ) {
        await entryActions.updateEntryContent({
          entryId,
          readabilityContent: entry.readabilityContent,
        })
      }
    }
    return entry
  }

  async fetchEntryReadabilityContent(
    entryId: EntryId,
    fallBack?: () => Promise<string | null | undefined>,
  ) {
    const entry = getEntry(entryId)
    if (!entry?.url) return entry
    if (
      entry.readabilityContent &&
      entry.readabilityUpdatedAt &&
      entry.readabilityUpdatedAt.getTime() > Date.now() - 1000 * 60 * 60 * 24 * 3
    ) {
      return entry
    }

    let readabilityContent: string | null | undefined

    try {
      const { data: contentByFetch } = await api().entries.readability({
        id: entryId,
      })
      readabilityContent = contentByFetch?.content || null
    } catch (error) {
      if (fallBack) {
        readabilityContent = await fallBack()
      } else {
        throw error
      }
    }
    if (readabilityContent) {
      await entryActions.updateEntryContent({
        entryId,
        readabilityContent,
      })
    }
    return entry
  }

  async fetchEntryContentByStream(remoteEntryIds?: string[]) {
    if (!remoteEntryIds || remoteEntryIds.length === 0) return

    const onlyNoStored = true

    const nextIds = [] as string[]
    if (onlyNoStored) {
      for (const id of remoteEntryIds) {
        const entry = getEntry(id)!
        if (entry.content) {
          continue
        }

        nextIds.push(id)
      }
    }

    if (nextIds.length === 0) return

    const readStream = async () => {
      const response = await api().entries.stream({
        ids: nextIds.slice(0, 30),
      })

      if (!response.ok) {
        console.error("Failed to fetch stream:", response.statusText, await response.text())
        return
      }

      // The lines of one network chunk are stored together, so a batch of entries updates the
      // store, and every timeline selector over it, once per chunk instead of once per entry
      let pending: { entryId: string; content: string }[] = []
      let flushTimer: ReturnType<typeof setTimeout> | undefined
      const flush = () => {
        flushTimer = undefined
        const contents = pending
        pending = []
        if (contents.length > 0) {
          void entryActions.updateEntryContents(contents)
        }
      }

      await readNdjsonStream<{ id: string; content: string }>(response, (json) => {
        pending.push({ entryId: json.id, content: json.content })
        flushTimer ??= setTimeout(flush, 0)
      })
      clearTimeout(flushTimer)
      flush()
    }

    readStream().catch((error) => {
      console.error("Failed to fetch entry contents:", error)
    })
  }

  async fetchEntryReadHistory(entryId: EntryId, size: number) {
    const res = await api().entries.readHistories({
      id: entryId,
      size,
    })

    await userActions.upsertMany(Object.values(res.data.users))

    return res.data
  }

  async deleteInboxEntry(entryId: string) {
    const entry = get().data[entryId]
    if (!entry || !entry.inboxHandle) return
    const tx = createTransaction()
    const currentEntry = cloneDeep(entry)

    tx.store(() => {
      entryActions.deleteInboxEntryById(entryId)
    })
    tx.request(async () => {
      await api().entries.inbox.delete({ entryId })
    })
    tx.rollback(() => {
      entryActions.upsertManyInSession([currentEntry])
    })
    tx.persist(() => {
      return EntryService.deleteMany([entryId])
    })
    await tx.run()
  }
}

export const entrySyncServices = new EntrySyncServices()
export const entryActions = new EntryActions()
export const debouncedFetchEntryContentByStream = debounce(
  entrySyncServices.fetchEntryContentByStream,
  1000,
)
