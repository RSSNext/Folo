import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { LRUCache } from "@follow/utils/lru-cache"
import type { Range, VirtualItem, Virtualizer } from "@tanstack/react-virtual"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { RefObject } from "react"
import { useCallback, useEffect, useMemo } from "react"

interface UseEntryVirtualizationOptions {
  count: number
  estimateSize?: () => number
  overscan?: number
  gap?: number
  cacheKey?: string
  onRangeChange?: (range: Range) => void
  scrollToIndex?: number | { index: number; align?: "start" | "center" | "end" | "auto" }
  scrollElement?: RefObject<HTMLElement> | (() => HTMLElement | null)
}

const capacity = 3
const offsetCache = new LRUCache<string, number>(capacity)
const measurementsCache = new LRUCache<string, VirtualItem[]>(capacity)

export const useEntryVirtualization = ({
  count,
  estimateSize = () => 112,
  overscan = 5,
  gap,
  cacheKey = "entry-list",
  onRangeChange,
  scrollToIndex,
  scrollElement,
}: UseEntryVirtualizationOptions) => {
  const defaultScrollRef = useScrollViewElement()

  const getScrollElement = useCallback(() => {
    if (scrollElement) {
      return typeof scrollElement === "function" ? scrollElement() : scrollElement.current
    }
    return defaultScrollRef
  }, [scrollElement, defaultScrollRef])

  const rowVirtualizer = useVirtualizer({
    count,
    estimateSize,
    overscan,
    gap,
    getScrollElement,
    initialOffset: offsetCache.get(cacheKey) ?? 0,
    initialMeasurementsCache: measurementsCache.get(cacheKey) ?? [],
    onChange: useTypeScriptHappyCallback(
      (virtualizer: Virtualizer<HTMLElement, Element>) => {
        if (!virtualizer.isScrolling) {
          measurementsCache.put(cacheKey, virtualizer.measurementsCache)
          offsetCache.put(cacheKey, virtualizer.scrollOffset ?? 0)
        }

        onRangeChange?.(virtualizer.range as Range)
      },
      [cacheKey],
    ),
  })

  // Handle scroll to index with viewport check
  useEffect(() => {
    if (scrollToIndex !== undefined) {
      const targetIndex = typeof scrollToIndex === "number" ? scrollToIndex : scrollToIndex.index

      // Check if target index is already in viewport
      const { range } = rowVirtualizer
      if (range && targetIndex >= range.startIndex && targetIndex <= range.endIndex) {
        // Target is already visible, no need to scroll
        return
      }

      if (typeof scrollToIndex === "number") {
        rowVirtualizer.scrollToIndex(scrollToIndex)
      } else {
        rowVirtualizer.scrollToIndex(scrollToIndex.index, { align: scrollToIndex.align })
      }
    }
  }, [scrollToIndex, rowVirtualizer])

  const virtualItems = rowVirtualizer.getVirtualItems()

  // Create render data with common transformations
  const renderData = useMemo(() => {
    return virtualItems.map((virtualRow) => ({
      key: virtualRow.key,
      index: virtualRow.index,
      start: virtualRow.start,
      size: virtualRow.size,
      transform: `translateY(${virtualRow.start}px)`,
    }))
  }, [virtualItems])

  // Scroll to specific index programmatically with viewport check
  const scrollTo = useCallback(
    (index: number, align?: "start" | "center" | "end" | "auto") => {
      // Check if target index is already in viewport
      const { range } = rowVirtualizer
      if (range && index >= range.startIndex && index <= range.endIndex) {
        // Target is already visible, no need to scroll
        return
      }

      rowVirtualizer.scrollToIndex(index, { align })
    },
    [rowVirtualizer],
  )

  return {
    virtualizer: rowVirtualizer,
    virtualItems,
    renderData,
    totalSize: rowVirtualizer.getTotalSize(),
    scrollTo,
    measureElement: rowVirtualizer.measureElement,
  }
}
