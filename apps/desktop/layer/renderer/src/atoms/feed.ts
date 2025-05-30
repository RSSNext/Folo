import { jotaiStore } from "@follow/utils/jotai"
import { isBizId } from "@follow/utils/utils"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useMemo } from "react"

import { FEED_COLLECTION_LIST, ROUTE_FEED_PENDING } from "~/constants"

const feedUnreadDirtySetAtom = atom(new Set<string>())

// 1. feedId may be feedId, or `inbox-id` or `feedId, feedId,` or `list-id`, or `all`, or `collections`
export const useFeedUnreadIsDirty = (feedId: string) => {
  return useAtomValue(
    useMemo(
      () =>
        selectAtom(feedUnreadDirtySetAtom, (set) => {
          const isRealFeedId = isBizId(feedId)

          if (isRealFeedId) return set.has(feedId)

          if (feedId === ROUTE_FEED_PENDING) {
            return set.size > 0
          }

          if (feedId === FEED_COLLECTION_LIST) {
            // Entry in collections has not unread status
            return false
          }

          const splitted = feedId.split(",")
          let isDirty = false
          for (const feedId of splitted) {
            if (isBizId(feedId)) {
              isDirty = isDirty || set.has(feedId)

              if (isDirty) break
            }
          }
          return isDirty
        }),
      [feedId],
    ),
  )
}

export const setFeedUnreadDirty = (feedId: string) => {
  jotaiStore.set(feedUnreadDirtySetAtom, (prev) => {
    const newSet = new Set(prev)
    newSet.add(feedId)
    return newSet
  })
}

export const clearFeedUnreadDirty = (feedId: string) => {
  jotaiStore.set(feedUnreadDirtySetAtom, (prev) => {
    const newSet = new Set(prev)
    newSet.delete(feedId)
    return newSet
  })
}

export const clearAllFeedUnreadDirty = () => {
  jotaiStore.set(feedUnreadDirtySetAtom, new Set())
}
