import type { FeedViewType } from "@follow/constants"
import { useCallback } from "react"

import { useCollectionStore } from "./store"

export const useCollectionEntry = (entryId: string) => {
  return useCollectionStore(
    useCallback(
      (state) => {
        return state.collections[entryId]
      },
      [entryId],
    ),
  )
}

export const useIsEntryStarred = (entryId: string) => {
  return useCollectionStore(
    useCallback(
      (state) => {
        return !!state.collections[entryId]
      },
      [entryId],
    ),
  )
}

export const useCollectionEntryList = (view: FeedViewType) => {
  return useCollectionStore(
    useCallback(
      (state) => {
        return Object.values(state.collections)
          .filter((collection) => collection.view === view)
          .sort((a, b) => (new Date(a.createdAt ?? 0) > new Date(b.createdAt ?? 0) ? -1 : 1))
          .map((i) => i.entryId)
      },
      [view],
    ),
  )
}
