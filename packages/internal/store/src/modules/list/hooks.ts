import type { FeedViewType } from "@follow/constants"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import type { GeneralQueryOptions } from "../../types"
import { whoami } from "../user/getters"
import { useWhoami } from "../user/hooks"
import { listSyncServices, useListStore } from "./store"
import type { ListModel } from "./types"

export function useListById(id: string | undefined): ListModel | undefined
export function useListById<T>(
  id: string | undefined,
  selector: (list: ListModel) => T,
): T | undefined
export function useListById<T = ListModel>(
  id: string | undefined,
  selector?: (list: ListModel) => T,
) {
  return useListStore((state) => {
    if (!id) return
    const list = state.lists[id]
    if (!list) return
    return selector ? selector(list) : list
  })
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

export const useListFeedIds = (id: string) => {
  return useListStore((state) => {
    return state.lists[id]?.feedIds
  })
}
export const useListsFeedIds = (ids: string[]) => {
  return useListStore((state) => {
    return ids.flatMap((id) => state.lists[id]?.feedIds || [])
  })
}

export const useIsOwnList = (id: string) => {
  return useListStore((state) => {
    return state.lists[id]?.userId === whoami()?.id
  })
}

export const useOwnedLists = () => {
  return useListStore(
    useCallback((state) => {
      return Object.values(state.lists).filter((list) => list.userId === whoami()?.id)
    }, []),
  )
}

export const usePrefetchLists = () => {
  return useQuery({
    queryKey: ["owned", "lists"],
    queryFn: () => listSyncServices.fetchOwnedLists(),
  })
}

export const usePrefetchListById = (id: string | undefined, options?: GeneralQueryOptions) => {
  return useQuery({
    ...options,
    queryKey: ["list", id],
    queryFn: () => listSyncServices.fetchListById({ id }),
  })
}
