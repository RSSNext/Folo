import type { FeedViewType } from "@follow/constants"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"

import {
  ensureSyncedThroughEngine,
  isSyncEngineActive,
  requestUnreadCalibration,
} from "../../sync/sync-status"
import { getEntry } from "../entry/getter"
import { useListFeedIds } from "../list/hooks"
import { useSubscriptionIdsByView } from "../subscription/hooks"
import { useIsLoggedIn } from "../user/hooks"
import { getUnreadCountForScope } from "./getters"
import { unreadCountAllSelector, unreadCountIdSelector, unreadCountIdsSelector } from "./selectors"
import { unreadSyncService, useUnreadStore } from "./store"
import type { UnreadListScope } from "./types"

export const usePrefetchUnread = () => {
  const isLoggedIn = useIsLoggedIn()
  return useQuery({
    queryKey: ["unread"],
    queryFn: async () => {
      // With a sync cursor the counters are the local snapshot plus the delta feed; the
      // recount is only needed when the engine cannot provide that.
      if (await ensureSyncedThroughEngine()) return null
      return unreadSyncService.resetFromRemote()
    },
    staleTime: 5 * 1000 * 60, // 5 minutes
    enabled: isLoggedIn,
  })
}

const hasUnreadMismatch = (entryIds: string[]) => {
  const unreadCountMap: Record<string, number> = {}
  for (const entryId of entryIds) {
    const entry = getEntry(entryId)
    if (entry && entry.feedId && !entry.read) {
      unreadCountMap[entry.feedId] = (unreadCountMap[entry.feedId] || 0) + 1
    }
  }

  const unread = useUnreadStore.getState().data
  return Object.keys(unreadCountMap).some(
    (feedId) =>
      !unread[feedId] || (unreadCountMap[feedId] && unreadCountMap[feedId] > unread[feedId]),
  )
}

/**
 * A fully loaded unread-only list that shows fewer unread entries than its counter. The
 * counter is wrong then: every unread entry the server knows of is on screen.
 */
export const hasUnreadCounterAboveList = (entryIds: string[], scope: UnreadListScope) => {
  const expected = getUnreadCountForScope(scope)
  if (!expected) return false

  let shown = 0
  for (const entryId of entryIds) {
    const entry = getEntry(entryId)
    if (entry && !entry.read) shown += 1
  }
  return expected > shown
}

export interface SyncUnreadWhenUnMatchOptions {
  /** The list only holds unread entries and has no more pages to load. */
  complete?: boolean
  scope?: UnreadListScope
}

/**
 * Notice counters that disagree with the list on screen: lower than the unread entries it
 * shows, or higher than a fully loaded unread-only list. Without the sync engine the
 * counters are fetched again. With it, the list is usually just ahead of the next pull, so
 * the delta feed is applied first and a recount is only asked for if that did not help.
 */
export const useSyncUnreadWhenUnMatch = (
  entryIds: string[],
  options?: SyncUnreadWhenUnMatchOptions,
) => {
  const complete = options?.complete === true
  const scope = options?.scope
  const scopeKey = scope ? JSON.stringify(scope) : ""

  useEffect(() => {
    const mismatch = () =>
      hasUnreadMismatch(entryIds) ||
      (complete && scope !== undefined && hasUnreadCounterAboveList(entryIds, scope))
    if (!mismatch()) return

    if (!isSyncEngineActive()) {
      unreadSyncService.resetFromRemote()
      return
    }

    void (async () => {
      await ensureSyncedThroughEngine()
      if (mismatch()) {
        await requestUnreadCalibration()
      }
    })()
  }, [entryIds.toString(), complete, scopeKey])
}

export const useAutoMarkAsRead = (entryId: string, enabled: boolean) => {
  const { mutate } = useMutation({
    mutationFn: (entryId: string) => unreadSyncService.markEntryAsRead(entryId),
  })
  useEffect(() => {
    if (enabled) {
      mutate(entryId)
    }
  }, [enabled, entryId, mutate])
}

export const useUnreadById = (id: string) => {
  return useUnreadStore(
    useCallback(
      (state) => {
        return unreadCountIdSelector(id)(state)
      },
      [id],
    ),
  )
}

export const useUnreadByIds = (ids: string[]): number => {
  return useUnreadStore(
    useCallback(
      (state) => {
        return unreadCountIdsSelector(ids)(state)
      },
      [ids?.toString()],
    ),
  )
}

export const useUnreadAll = (): number => {
  return useUnreadStore(unreadCountAllSelector)
}

export const useUnreadByListId = (listId: string) => {
  const feedIds = useListFeedIds(listId)
  return useUnreadByIds(feedIds ?? [])
}

export const useUnreadByView = (view: FeedViewType) => {
  const subscriptionIds = useSubscriptionIdsByView(view)
  return useUnreadByIds(subscriptionIds)
}

export const useSortedIdsByUnread = (ids: string[], isDesc?: boolean) => {
  return useUnreadStore(
    useCallback(
      (state) =>
        ids.sort((a, b) => {
          const unreadCompare = (state.data[b] || 0) - (state.data[a] || 0)
          if (unreadCompare !== 0) {
            return isDesc ? unreadCompare : -unreadCompare
          }
          return a.localeCompare(b)
        }),
      [ids.toString(), isDesc],
    ),
  )
}

/**
 * @param categories key: category name, value: array of ids
 * @returns array of tuples [category, ids]
 */
export const useSortedCategoriesByUnread = (
  categories: Record<string, string[]>,
  isDesc?: boolean,
) => {
  return useUnreadStore(
    useCallback(
      (state) => {
        const sortedList = [] as [string, string[]][]

        const folderUnread = {} as Record<string, number>
        // Calc total unread count for each folder
        for (const category in categories) {
          folderUnread[category] = categories[category]!.reduce(
            (acc, cur) => (state.data[cur] || 0) + acc,
            0,
          )
        }

        // Sort by unread count
        Object.keys(folderUnread)
          .sort((a, b) => folderUnread[b]! - folderUnread[a]!)
          .forEach((key) => {
            sortedList.push([key, categories[key]!.concat()])
          })

        if (!isDesc) {
          sortedList.reverse()
        }
        return sortedList
      },
      [categories, isDesc],
    ),
  )
}
