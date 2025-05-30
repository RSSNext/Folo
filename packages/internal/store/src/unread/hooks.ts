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
