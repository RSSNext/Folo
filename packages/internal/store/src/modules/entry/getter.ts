import type { FeedViewType } from "@follow/constants"

import { createSingleArgGetter, createStaticGetter } from "../../lib/helper"
import { getSubscriptionByEntryId } from "../subscription/getter"
import { useEntryStore } from "./store"

export const getEntry = (id: string) => {
  return useEntryStore.getState().data[id]
}

function sortEntryIdsByPublishDate(a: string, b: string) {
  const entryA = getEntry(a)
  const entryB = getEntry(b)
  if (!entryA || !entryB) return 0
  return entryB.publishedAt.getTime() - entryA.publishedAt.getTime()
}

// Utility functions for creating getters
type StateType = ReturnType<typeof useEntryStore.getState>
const getState = () => useEntryStore.getState()

// Store selector functions (for React hooks)
export const getHasEntrySelector = (state: StateType) => (id: string) => {
  return !!state.data[id]
}

export const getEntryIdsByViewSelector =
  (state: StateType) => (view: FeedViewType, excludePrivate: boolean | undefined) => {
    const ids = state.entryIdByView[view]
    if (!ids) return null
    return Array.from(ids)
      .filter((id) => {
        const subscription = getSubscriptionByEntryId(id)
        if ((excludePrivate && subscription?.isPrivate) || subscription?.hideFromTimeline) {
          return false
        }
        return true
      })
      .sort((a, b) => sortEntryIdsByPublishDate(a, b))
  }

export const getEntryIdsByFeedIdSelector = (state: StateType) => (feedId: string | undefined) => {
  if (!feedId) return null
  const ids = state.entryIdByFeed[feedId]
  if (!ids) return null
  return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
}

export const getEntryIdsByFeedIdsSelector =
  (state: StateType) => (feedIds: string[] | undefined) => {
    const ids = feedIds?.flatMap((feedId) => Array.from(state.entryIdByFeed[feedId] || []))
    if (!ids) return null
    return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
  }

export const getEntryIdsByInboxIdSelector = (state: StateType) => (inboxId: string | undefined) => {
  if (!inboxId) return null
  const ids = state.entryIdByInbox[inboxId]
  if (!ids) return null
  return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
}

export const getEntryIdsByCategorySelector = (state: StateType) => (category: string) => {
  const ids = state.entryIdByCategory[category]
  if (!ids) return null
  return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
}

export const getEntryIdsByListIdSelector = (state: StateType) => (listId: string | undefined) => {
  if (!listId) return null
  const ids = state.entryIdByList[listId]
  if (!ids) return null
  return Array.from(ids).sort((a, b) => sortEntryIdsByPublishDate(a, b))
}

export const getEntryIsInboxSelector = (state: StateType) => (entryId: string) => {
  const entry = state.data[entryId]
  if (!entry) return false
  return !!entry.inboxHandle
}

// Static getters for use outside React components
export const hasEntry = createSingleArgGetter(getState, getHasEntrySelector)
export const getEntryIdsByView = createStaticGetter(getState, getEntryIdsByViewSelector)
export const getEntryIdsByFeedId = createSingleArgGetter(getState, getEntryIdsByFeedIdSelector)
export const getEntryIdsByFeedIds = createSingleArgGetter(getState, getEntryIdsByFeedIdsSelector)
export const getEntryIdsByInboxId = createSingleArgGetter(getState, getEntryIdsByInboxIdSelector)
export const getEntryIdsByCategory = createSingleArgGetter(getState, getEntryIdsByCategorySelector)
export const getEntryIdsByListId = createSingleArgGetter(getState, getEntryIdsByListIdSelector)
export const isEntryInbox = createSingleArgGetter(getState, getEntryIsInboxSelector)
