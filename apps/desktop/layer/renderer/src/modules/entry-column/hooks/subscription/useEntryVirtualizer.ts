import type { Range } from "@tanstack/react-virtual"
import type { RefObject } from "react"
import { useCallback, useMemo } from "react"

import { useEntryVirtualization } from "../useEntryVirtualization"

interface UseEntryVirtualizerOptions {
  entriesIds: string[]
  onRangeChange?: (range: Range) => void
  scrollToEntryId?: string
  scrollElement?: RefObject<HTMLElement> | (() => HTMLElement | null)
}

export const useEntryVirtualizer = ({
  entriesIds,
  onRangeChange,
  scrollToEntryId,
  scrollElement,
}: UseEntryVirtualizerOptions) => {
  // Find scroll to index
  const scrollToIndex = useMemo(() => {
    if (scrollToEntryId) {
      const index = entriesIds.indexOf(scrollToEntryId)
      return index !== -1 ? { index, align: "start" as const } : undefined
    }
    return
  }, [entriesIds, scrollToEntryId])

  const virtualization = useEntryVirtualization({
    count: entriesIds.length + 1, // +1 for loading placeholder
    estimateSize: () => 48, // Smaller height for subscription column
    overscan: 5,
    cacheKey: "entry-subscription-list",
    onRangeChange,
    scrollToIndex,
    scrollElement,
  })

  // Memoized render data with subscription-specific logic
  const renderData = useMemo(() => {
    return virtualization.renderData.map((item) => {
      const isLoaderRow = item.index === entriesIds.length

      return {
        key: item.key,
        index: item.index,
        isLoaderRow,
        transform: item.transform,
        entryId: isLoaderRow ? null : entriesIds[item.index],
      }
    })
  }, [virtualization.renderData, entriesIds])

  // Scroll to specific entry programmatically
  const scrollToEntry = useCallback(
    (entryId: string) => {
      const index = entriesIds.indexOf(entryId)
      if (index !== -1) {
        virtualization.scrollTo(index, "start")
      }
    },
    [entriesIds, virtualization],
  )

  return {
    rowVirtualizer: virtualization.virtualizer,
    renderData,
    totalSize: virtualization.totalSize,
    scrollToEntry,
  }
}
