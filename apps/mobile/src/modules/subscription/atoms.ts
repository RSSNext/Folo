import { FeedViewType } from "@follow/constants"
import { createAtomHooks, jotaiStore } from "@follow/utils"
import { atom, useAtomValue } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useMemo } from "react"

import { views } from "@/src/constants/views"
import { JotaiPersistSyncStorage } from "@/src/lib/jotai"

export const viewAtom = atom<FeedViewType>(FeedViewType.Articles)

export const useCurrentView = () => {
  return useAtomValue(viewAtom)
}

export const useCurrentViewDefinition = () => {
  const view = useCurrentView()
  const viewDef = useMemo(() => views.find((v) => v.view === view), [view])
  if (!viewDef) {
    throw new Error(`View ${view} not found`)
  }
  return viewDef
}

export const offsetAtom = atom<number>(0)

export const setCurrentView = (view: FeedViewType) => {
  jotaiStore.set(viewAtom, view)
}

export const [
  ,
  ,
  useFeedListSortMethod,
  useSetFeedListSortMethod,
  getFeedListSortMethod,
  setFeedListSortMethod,
] = createAtomHooks(
  atomWithStorage<"alphabet" | "count">("listSortMethod", "alphabet", JotaiPersistSyncStorage, {
    getOnInit: true,
  }),
)

export const [
  ,
  ,
  useFeedListSortOrder,
  useSetFeedListSortOrder,
  getFeedListSortOrder,
  setFeedListSortOrder,
] = createAtomHooks(
  atomWithStorage<"asc" | "desc">("listSortOrder", "asc", JotaiPersistSyncStorage, {
    getOnInit: true,
  }),
)
