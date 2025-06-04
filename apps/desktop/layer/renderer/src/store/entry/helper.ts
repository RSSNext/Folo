import { create, keyResolver, windowScheduler } from "@yornaath/batshit"

import { apiClient } from "~/lib/api-fetch"

import { useFeedStore } from "../feed"
import { useSubscriptionStore } from "../subscription"
import { useEntryStore } from "./store"
import type { EntryFilter } from "./types"

export const getSortedEntryIds = (entriesIds: string[]) => {
  const state = useEntryStore.getState()
  const idsSorted = entriesIds.sort((a, b) => {
    const entryA = state.flatMapEntries[a]
    const entryB = state.flatMapEntries[b]
    if (!entryA || !entryB) return 0
    return (
      new Date(entryB.entries.publishedAt).getTime() -
      new Date(entryA.entries.publishedAt).getTime()
    )
  })
  return idsSorted
}

export const getFilteredFeedIds = (feedIds: string[], filter?: EntryFilter) => {
  const state = useEntryStore.getState()
  const ids = [] as string[]
  for (const feedId of feedIds) {
    const entries = state.entries[feedId] || []

    ids.push(...entries)
  }

  if (filter?.unread) {
    const result = [] as string[]
    for (const entryId of ids) {
      const entry = state.flatMapEntries[entryId]
      if (!entry?.read) {
        result.push(entryId)
      }
    }
    return getSortedEntryIds(result)
  }
  return getSortedEntryIds(ids)
}

const unread = create({
  fetcher: async (
    ids: {
      entryId: string
      isInbox: boolean
      isPrivate?: boolean
    }[],
  ) => {
    await apiClient.reads.$post({
      json: {
        entryIds: ids.map((i) => i.entryId),
        isInbox: ids[0]!.isInbox,
        readHistories: ids.filter((i) => !i.isPrivate).map((i) => i.entryId),
      },
    })

    return []
  },
  resolver: keyResolver("id"),
  scheduler: windowScheduler(1000),
})
/**
 * Only call in store action
 * @internal
 */
export const internal_batchMarkRead = (...args: Parameters<typeof unread.fetch>) =>
  unread.fetch.apply(null, args)

export const getEntryIsInView = (entryId: string) => {
  const state = useEntryStore.getState()
  const entry = state.flatMapEntries[entryId]
  if (!entry) return
  const { feedId } = entry
  const feed = useFeedStore.getState().feeds[feedId]
  if (!feed?.id) return
  const subscription = useSubscriptionStore.getState().data[feed.id]
  if (!subscription) return
  return subscription.view
}
