import type { FeedViewType } from "@follow/constants"
import type { ListModel } from "@follow/models/types"
import { useCallback, useMemo } from "react"

import { useWhoami } from "~/atoms/user"

import { useListStore } from "./store"

const defaultSelector = (list) => list
export function useListById<T>(listId: Nullable<string>, selector: (list: ListModel) => T): T | null
export function useListById(listId: Nullable<string>): ListModel | null

export function useListById<T>(
  listId: Nullable<string>,
  selector: (list: ListModel) => T = defaultSelector,
): T | null {
  return useListStore((state) =>
    listId && state.lists[listId] ? selector(state.lists[listId]) : null,
  )
}

export const useListByView = (view: FeedViewType) => {
  return useListStore(
    useCallback((state) => Object.values(state.lists).filter((list) => list.view === view), [view]),
  )
}

export const useOwnedListByView = (view: FeedViewType) => {
  const whoami = useWhoami()
  const viewLists = useListByView(view)
  return useMemo(
    () => viewLists.filter((list) => list.ownerUserId === whoami?.id),
    [viewLists, whoami],
  )
}

export const useOwnedLists = () => {
  const whoami = useWhoami()
  return useListStore(
    useCallback(
      (state) => Object.values(state.lists).filter((list) => list.ownerUserId === whoami?.id),
      [whoami?.id],
    ),
  )
}

export const useListsFeedIds = (listIds: string[]) => {
  const listFeedIds = useListStore(
    (state) => listIds.flatMap((id) => state.lists[id]?.feedIds).filter(Boolean) as string[],
  )
  return listFeedIds
}
