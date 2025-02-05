import { FeedViewType } from "@follow/constants"

import { apiClient } from "@/src/lib/api-fetch"
import { honoMorph } from "@/src/morph/hono"
import { storeDbMorph } from "@/src/morph/store-db"
import { EntryService } from "@/src/services/entry"

import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { listActions } from "../list/store"
import { getSubscription } from "../subscription/getter"
import type { EntryModel, FetchEntriesProps } from "./types"
import { getEntriesParams } from "./utils"

type EntryId = string
type FeedId = string
type InboxId = string
type Category = string

interface EntryState {
  data: Record<EntryId, EntryModel>
  entryIdByView: Record<FeedViewType, Set<EntryId>>
  entryIdByCategory: Record<Category, Set<EntryId>>
  entryIdByFeed: Record<FeedId, Set<EntryId>>
  entryIdByInbox: Record<InboxId, Set<EntryId>>
}

const defaultState: EntryState = {
  data: {},
  entryIdByView: {
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
}

export const useEntryStore = createZustandStore<EntryState>("entry")(() => defaultState)

const set = useEntryStore.setState
const immerSet = createImmerSetter(useEntryStore)

class EntryActions {
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

    const subscription = getSubscription(feedId)
    if (typeof subscription?.view === "number") {
      draft.entryIdByView[subscription.view].add(entryId)
    }
    if (subscription?.category) {
      const entryIdSetByCategory = draft.entryIdByCategory[subscription.category]
      if (!entryIdSetByCategory) {
        draft.entryIdByCategory[subscription.category] = new Set([entryId])
      } else {
        entryIdSetByCategory.add(entryId)
      }
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

  upsertManyInSession(entries: EntryModel[]) {
    if (entries.length === 0) return

    immerSet((draft) => {
      for (const entry of entries) {
        draft.data[entry.id] = entry

        const { feedId, inboxHandle } = entry
        this.addEntryIdToFeed({
          draft,
          feedId,
          entryId: entry.id,
        })

        this.addEntryIdToInbox({
          draft,
          inboxHandle,
          entryId: entry.id,
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

  reset(entries: EntryModel[] = []) {
    if (entries.length > 0) {
      immerSet((draft) => {
        // remove all entries from draft.data not in entries
        for (const existingEntry of Object.values(draft.data)) {
          if (!entries.some((e) => e.id === existingEntry.id)) {
            delete draft.data[existingEntry.id]
          }
        }
      })
    } else {
      set(defaultState)
    }
  }
}

class EntrySyncServices {
  async fetchEntries(props: FetchEntriesProps) {
    const { feedId, inboxId, listId, view, read, limit, pageParam, isArchived } = props
    const params = getEntriesParams({
      feedId,
      inboxId,
      listId,
      view,
    })
    const res = await apiClient.entries.$post({
      json: {
        publishedAfter: pageParam,
        read,
        limit,
        isArchived,
        ...params,
      },
    })

    const entries = honoMorph.toEntryList(res.data)

    await entryActions.upsertMany(entries)
    if (params.listId) {
      await listActions.addEntryIds({
        listId: params.listId,
        entryIds: entries.map((e) => e.id),
      })
    }
    return entries
  }

  async fetchEntryContent(entryId: EntryId) {
    const res = await apiClient.entries.$get({ query: { id: entryId } })
    const entry = honoMorph.toEntry(res.data)
    if (!entry) return null
    await entryActions.upsertMany([entry])
    return entry
  }
}

export const entrySyncServices = new EntrySyncServices()
export const entryActions = new EntryActions()
