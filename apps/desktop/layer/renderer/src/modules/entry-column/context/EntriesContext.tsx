import type { FeedViewType } from "@follow/constants"
import { createContext, use, useMemo, useRef } from "react"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { useEntriesByView } from "../hooks/useEntriesByView"

type EntriesContextValue = {
  entriesIds: string[]
  groupedCounts?: number[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetching: boolean
  isLoading: boolean
  error: unknown | null
  fetchNextPage: () => void | Promise<void>
  refetch: () => void | Promise<void>
  view: FeedViewType
  hasUpdate: boolean
  fetchedTime?: number
  setOnReset: (cb: (() => void) | null) => void
}

const EntriesContext = createContext<EntriesContextValue | undefined>(undefined)

export const EntriesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const onResetRef = useRef<(() => void) | null>(null)
  const { view } = useRouteParams()

  const entries = useEntriesByView({
    onReset: () => {
      onResetRef.current?.()
    },
  })

  const value: EntriesContextValue = useMemo(
    () => ({
      entriesIds: entries.entriesIds,
      groupedCounts: entries.groupedCounts,
      hasNextPage: entries.hasNextPage,
      isFetchingNextPage: entries.isFetchingNextPage,
      isFetching: entries.isFetching,
      isLoading: entries.isLoading,
      error: (entries as any).error ?? null,
      fetchNextPage: entries.fetchNextPage,
      refetch: entries.refetch,
      view: view!,
      hasUpdate: (entries as any).hasUpdate,
      fetchedTime: (entries as any).fetchedTime,
      setOnReset: (cb) => {
        onResetRef.current = cb
      },
    }),
    [entries, view],
  )

  return <EntriesContext value={value}>{children}</EntriesContext>
}

export const useEntriesContext = () => {
  const ctx = use(EntriesContext)
  if (!ctx) throw new Error("useEntriesContext must be used within EntriesProvider")
  return ctx
}
