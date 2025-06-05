import type { FeedViewType } from "@follow/constants"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"

import { useListFeedIds } from "../list/hooks"
import { useSubscriptionByView } from "../subscription/hooks"
import { unreadSyncService, useUnreadStore } from "./store"

export const usePrefetchUnread = () => {
  return useQuery({
    queryKey: ["unread"],
    queryFn: () => unreadSyncService.resetFromRemote(),
    staleTime: 5 * 1000 * 60, // 5 minutes
  })
}

export const useAutoMarkAsRead = (entryId: string) => {
  const { mutate } = useMutation({
    mutationFn: (entryId: string) => unreadSyncService.markEntryAsRead(entryId),
  })
  useEffect(() => {
    mutate(entryId)
  }, [entryId, mutate])
}

export const useUnreadCount = (subscriptionId: string) => {
  return useUnreadStore((state) => state.data[subscriptionId])
}

export const useListUnreadCount = (listId: string) => {
  const feedIds = useListFeedIds(listId)
  return useUnreadCounts(feedIds ?? [])
}

export const useUnreadCounts = (subscriptionIds?: string[]): number => {
  return useUnreadStore(
    useCallback(
      (state) => {
        if (!subscriptionIds)
          return Object.values(state.data).reduce((acc, unread) => acc + unread, 0)

        let count = 0
        for (const subscriptionId of subscriptionIds) {
          count += state.data[subscriptionId] ?? 0
        }
        return count
      },
      [subscriptionIds?.toString()],
    ),
  )
}

export const useUnreadCountByView = (view: FeedViewType) => {
  const subscriptionIds = useSubscriptionByView(view)
  return useUnreadCounts(subscriptionIds)
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
            sortedList.push([key, categories[key]!])
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
