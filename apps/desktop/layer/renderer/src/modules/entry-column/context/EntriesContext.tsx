import type { FeedViewType } from "@follow/constants"
import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef } from "react"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { useEntriesByView } from "../hooks/useEntriesByView"

type EntriesStateContextValue = {
  entriesIds: string[]
  groupedCounts?: number[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetching: boolean
  isLoading: boolean
  error: unknown | null
  view: FeedViewType
  hasUpdate: boolean
  fetchedTime?: number
}

type EntriesActionsContextValue = {
  fetchNextPage: () => void | Promise<void>
  refetch: () => void | Promise<void>
  setOnReset: (cb: (() => void) | null) => void
  getNeighbors: (entryId: string) => {
    hasPrev: boolean
    hasNext: boolean
    prevId: string | null
    nextId: string | null
  }
}

const EntriesStateContext = createContext<EntriesStateContextValue | undefined>(undefined)
const EntriesActionsContext = createContext<EntriesActionsContextValue | undefined>(undefined)

export const EntriesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const onResetRef = useRef<(() => void) | null>(null)
  const { view } = useRouteParams()

  const entries = useEntriesByView({
    onReset: () => {
      onResetRef.current?.()
    },
  })

  const idToIndex = useMemo(() => {
    const map = new Map<string, number>()
    let i = 0
    for (const id of entries.entriesIds) {
      map.set(id, i)
      i++
    }
    return map
  }, [entries.entriesIds])

  // Keep latest dynamic values in refs for stable actions
  const entriesIdsRef = useRef(entries.entriesIds)
  useLayoutEffect(() => {
    entriesIdsRef.current = entries.entriesIds
  }, [entries.entriesIds])

  const idToIndexRef = useRef(idToIndex)
  useLayoutEffect(() => {
    idToIndexRef.current = idToIndex
  }, [idToIndex])

  const fetchNextPageRef = useRef(entries.fetchNextPage)
  useLayoutEffect(() => {
    fetchNextPageRef.current = entries.fetchNextPage
  }, [entries.fetchNextPage])

  const refetchRef = useRef(entries.refetch)
  useLayoutEffect(() => {
    refetchRef.current = entries.refetch
  }, [entries.refetch])

  // Stable actions that reference latest refs
  const fetchNextPageStable = useCallback(() => fetchNextPageRef.current?.(), [])
  const refetchStable = useCallback(() => refetchRef.current?.(), [])
  const setOnResetStable = useCallback((cb: (() => void) | null) => {
    onResetRef.current = cb
  }, [])
  const getNeighborsStable = useCallback<EntriesActionsContextValue["getNeighbors"]>((entryId) => {
    const index = idToIndexRef.current.get(entryId)
    if (index == null) {
      return { hasPrev: false, hasNext: false, prevId: null, nextId: null }
    }
    const ids = entriesIdsRef.current
    const prevIndex = index - 1
    const nextIndex = index + 1
    const prevId = prevIndex >= 0 ? (ids[prevIndex] ?? null) : null
    const nextId = nextIndex < ids.length ? (ids[nextIndex] ?? null) : null
    return {
      hasPrev: prevId != null,
      hasNext: nextId != null,
      prevId,
      nextId,
    }
  }, [])

  const stateValue: EntriesStateContextValue = useMemo(
    () => ({
      entriesIds: entries.entriesIds,
      groupedCounts: entries.groupedCounts,
      hasNextPage: entries.hasNextPage,
      isFetchingNextPage: entries.isFetchingNextPage,
      isFetching: entries.isFetching,
      isLoading: entries.isLoading,
      error: entries.error ?? null,
      view: view!,
      hasUpdate: entries.hasUpdate,
      fetchedTime: entries.fetchedTime,
    }),
    [entries, view],
  )

  const actionsValue: EntriesActionsContextValue = useMemo(
    () => ({
      fetchNextPage: fetchNextPageStable,
      refetch: refetchStable,
      setOnReset: setOnResetStable,
      getNeighbors: getNeighborsStable,
    }),
    [fetchNextPageStable, refetchStable, setOnResetStable, getNeighborsStable],
  )

  return (
    <EntriesStateContext value={stateValue}>
      <EntriesActionsContext value={actionsValue}>{children}</EntriesActionsContext>
    </EntriesStateContext>
  )
}

export const useEntriesState = () => {
  const ctx = use(EntriesStateContext)
  if (!ctx) throw new Error("useEntriesState must be used within EntriesProvider")
  return ctx
}

export const useEntriesActions = () => {
  const ctx = use(EntriesActionsContext)
  if (!ctx) throw new Error("useEntriesActions must be used within EntriesProvider")
  return ctx
}
