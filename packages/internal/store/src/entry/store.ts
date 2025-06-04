import { FeedViewType } from "@follow/constants"
import { EntryService } from "@follow/database/services/entry"
import { debounce } from "es-toolkit/compat"

import { collectionActions } from "../collection/store"
import { apiClient } from "../context"
import { feedActions } from "../feed/store"
import type { Hydratable, HydrationOptions } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { dbStoreMorph } from "../morph/db-store"
import { honoMorph } from "../morph/hono"
import { storeDbMorph } from "../morph/store-db"
import { getSubscription } from "../subscription/getter"
import { getDefaultCategory } from "../subscription/utils"
import type { PublishAtTimeRangeFilter } from "../unread/types"
import { getEntry } from "./getter"
import type { EntryModel, FetchEntriesProps, FetchEntriesPropsSettings } from "./types"
import { getEntriesParams } from "./utils"

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

const immerSet = createImmerSetter(useEntryStore)

class EntryActions implements Hydratable {
  async hydrate(options?: HydrationOptions) {
    const entries = await EntryService.getEntriesToHydrate()

    entryActions.upsertManyInSession(
      entries.map((e) => dbStoreMorph.toEntryModel(e)),
      options,
    )
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

    const subscription = getSubscription(feedId)
    const ignore = hidePrivateSubscriptionsInTimeline && subscription?.isPrivate

    if (typeof subscription?.view === "number" && !ignore) {
      draft.entryIdByView[subscription.view].add(entryId)
    }

    // lists
    for (const s of sources ?? []) {
      const subscription = getSubscription(s)
      const ignore = hidePrivateSubscriptionsInTimeline && subscription?.isPrivate

      if (typeof subscription?.view === "number" && !ignore) {
        draft.entryIdByView[subscription.view].add(entryId)
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
    const subscription = getSubscription(feedId)
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

    immerSet((draft) => {
      for (const entry of entries) {
        draft.entryIdSet.add(entry.id)
        draft.data[entry.id] = entry

        const { feedId, inboxHandle, read, sources } = entry
        if (unreadOnly && read) continue

        if (inboxHandle) {
          this.addEntryIdToInbox({
            draft,
            inboxHandle,
            entryId: entry.id,
          })
        } else {
          this.addEntryIdToFeed({
            draft,
            feedId,
            entryId: entry.id,
          })
        }

        this.addEntryIdToView({
          draft,
          feedId,
          entryId: entry.id,
          sources,
          hidePrivateSubscriptionsInTimeline,
        })

        this.addEntryIdToCategory({
          draft,
          feedId,
          entryId: entry.id,
        })

        entry.sources
          ?.filter((s) => s !== "feed")
          .forEach((s) => {
            this.addEntryIdToList({
              draft,
              listId: s,
              entryId: entry.id,
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
  }: {
    entryId: EntryId
    content?: string
    readabilityContent?: string
  }) {
    immerSet((draft) => {
      const entry = draft.data[entryId]
      if (!entry) return
      if (content) {
        entry.content = content
      }
      if (readabilityContent) {
        entry.readabilityContent = readabilityContent
      }
    })
  }

  async updateEntryContent({
    entryId,
    content,
    readabilityContent,
  }: {
    entryId: EntryId
    content?: string
    readabilityContent?: string
  }) {
    const tx = createTransaction()
    tx.store(() => {
      this.updateEntryContentInSession({ entryId, content, readabilityContent })
    })

    tx.persist(() => {
      if (content) {
        EntryService.patch({ id: entryId, content })
      }

      if (readabilityContent) {
        EntryService.patch({ id: entryId, readabilityContent })
      }
    })

    await tx.run()
  }

  markEntryReadStatusInSession({
    entryIds,
    feedIds,
    read,
    time,
  }: {
    entryIds?: EntryId[]
    feedIds?: FeedId[]
    read: boolean
    time?: PublishAtTimeRangeFilter
  }) {
    immerSet((draft) => {
      if (entryIds) {
        for (const entryId of entryIds) {
          const entry = draft.data[entryId]
          if (!entry) {
            continue
          }

          if (
            time &&
            (+new Date(entry.publishedAt) < time.startTime ||
              +new Date(entry.publishedAt) > time.endTime)
          ) {
            continue
          }

          entry.read = read
        }
      }

      if (feedIds) {
        const entries = Array.from(draft.entryIdSet)
          .map((id) => draft.data[id])
          .filter(
            (entry): entry is EntryModel =>
              !!entry && !!entry.feedId && feedIds.includes(entry.feedId),
          )

        for (const entry of entries) {
          if (
            time &&
            (+new Date(entry.publishedAt) < time.startTime ||
              +new Date(entry.publishedAt) > time.endTime)
          ) {
            continue
          }

          entry.read = read
        }
      }
    })
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
    } = props
    const params = getEntriesParams({
      feedId,
      inboxId,
      listId,
      view,
      feedIdList,
    })
    const res = params.inboxId
      ? await apiClient().entries.inbox.$post({
          json: {
            publishedAfter: pageParam,
            read,
            limit,
            isCollection,
            inboxId: params.inboxId,
            ...params,
          },
        })
      : await apiClient().entries.$post({
          json: {
            publishedAfter: pageParam,
            read,
            limit,
            isCollection,
            excludePrivate,
            ...params,
          },
        })

    const entries = honoMorph.toEntryList(res.data)
    const entriesInDB = await EntryService.getEntryMany(entries.map((e) => e.id))
    for (const entry of entries) {
      const entryInDB = entriesInDB.find((e) => e.id === entry.id)
      if (entryInDB) {
        entry.content = entryInDB.content
        entry.readabilityContent = entryInDB.readabilityContent
      }
    }

    await entryActions.upsertMany(entries)

    // After initial fetch, we can reset the state to prefer the entries data from the server
    if (!pageParam) {
      if (params.view !== undefined) {
        entryActions.resetByView({ view: params.view, entries })
      }

      if (params.feedIdList && params.feedIdList.length > 0) {
        const firstSubscription = getSubscription(params.feedIdList[0])
        const category = firstSubscription?.category || getDefaultCategory(firstSubscription)
        if (category) {
          entryActions.resetByCategory({ category, entries })
        }
      }

      if (params.feedId) {
        entryActions.resetByFeed({ feedId: params.feedId, entries })
      }

      if (params.inboxId) {
        entryActions.resetByInbox({ inboxId: params.inboxId, entries })
      }

      if (params.listId) {
        entryActions.resetByList({ listId: params.listId, entries })
      }
    }

    if (isCollection && res.data) {
      if (view === undefined) {
        console.error("view is required for collection")
      }
      const collections = honoMorph.toCollections(res.data, view ?? 0)
      await collectionActions.upsertMany(collections)
    }

    const feeds =
      res.data
        ?.map((e) => e.feeds)
        .filter((f) => f.type === "feed")
        .map((f) => honoMorph.toFeed(f)) ?? []
    feedActions.upsertMany(feeds)

    return res
  }

  async fetchEntryDetail(entryId: EntryId) {
    const currentEntry = getEntry(entryId)
    const res = currentEntry?.inboxHandle
      ? await apiClient().entries.inbox.$get({ query: { id: entryId } })
      : await apiClient().entries.$get({ query: { id: entryId } })
    const entry = honoMorph.toEntry(res.data)
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

  async fetchEntryReadabilityContent(entryId: EntryId) {
    const entry = getEntry(entryId)

    if (entry?.url && entry?.readabilityContent === null) {
      const { data: contentByFetch } = await apiClient().entries.readability.$get({
        query: {
          id: entryId,
        },
      })
      if (contentByFetch?.content && entry?.readabilityContent !== contentByFetch.content) {
        await entryActions.updateEntryContent({
          entryId,
          readabilityContent: contentByFetch.content,
        })
      }
    }
    return entry
  }

  async fetchEntryContentByStream(
    remoteEntryIds?: string[],
    options?: {
      fetch?: typeof fetch
      cookie?: string
    },
  ) {
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
      // https://github.com/facebook/react-native/issues/37505
      // TODO: And it seems we can not just use fetch from expo for ofetch, need further investigation
      const response = await (options?.fetch || fetch)(
        apiClient().entries.stream.$url().toString(),
        {
          method: "POST",
          headers: options?.cookie
            ? {
                cookie: options.cookie,
              }
            : undefined,
          body: JSON.stringify({
            ids: nextIds,
          }),
        },
      )
      if (!response.ok) {
        console.error("Failed to fetch stream:", response.statusText, await response.text())
        return
      }

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")

          // Process all complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i]!.trim()) {
              const json = JSON.parse(lines[i]!)
              // Handle each JSON line here
              entryActions.updateEntryContent({ entryId: json.id, content: json.content })
            }
          }

          // Keep the last incomplete line in the buffer
          buffer = lines.at(-1) || ""
        }

        // Process any remaining data
        if (buffer.trim()) {
          const json = JSON.parse(buffer)

          entryActions.updateEntryContent({ entryId: json.id, content: json.content })
        }
      } catch (error) {
        console.error("Error reading stream:", error)
      } finally {
        reader.releaseLock()
      }
    }

    readStream()
  }
}

export const entrySyncServices = new EntrySyncServices()
export const entryActions = new EntryActions()
export const debouncedFetchEntryContentByStream = debounce(
  entrySyncServices.fetchEntryContentByStream,
  1000,
)
