import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { whoami } from "../user/getters"
import { listSyncServices, useListStore } from "./store"

export const useList = (id: string) => {
  return useListStore((state) => {
    return state.lists[id]
  })
}

export const useIsOwnList = (id: string) => {
  return useListStore((state) => {
    return state.lists[id]?.userId === whoami()?.id
  })
}

export const useListEntryIds = (id: string) => {
  return useListStore((state) => {
    return state.lists[id]?.entryIds || []
  })
}

export const useOwnedLists = () => {
  return useListStore(
    useCallback((state) => {
      return Object.values(state.lists).filter((list) => list.userId === whoami()?.id)
    }, []),
  )
}
export const usePrefetchOwnedLists = () => {
  return useQuery({
    queryKey: ["owned", "lists"],
    queryFn: () => listSyncServices.fetchOwnedLists(),
  })
}
