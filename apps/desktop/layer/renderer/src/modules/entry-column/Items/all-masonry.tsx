import { Masonry } from "@follow/components/ui/masonry/index.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { FeedViewType } from "@follow/constants"
import { useRefValue } from "@follow/hooks"
import { getEntry } from "@follow/store/entry/getter"
import { clsx } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import type { RenderComponentProps } from "masonic"
import { useInfiniteLoader } from "masonic"
import type { FC, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"

import { batchMarkRead } from "../hooks/useEntryMarkReadHandler"
import { EntryItem } from "../item"

interface AllMasonryProps {
  data: string[]
  hasNextPage: boolean
  endReached: () => void
  Footer?: FC | ReactNode
}

const GUTTER = 16
const COLUMN_WIDTH = 300
const OVERSCAN = 2

interface MasonryItem {
  entryId: string
}

export const AllMasonry: FC<AllMasonryProps> = ({ data, hasNextPage, endReached, Footer }) => {
  const scrollElement = useScrollViewElement()
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState<number>(0)

  // Convert entry IDs to masonry items with stable references
  const items = useMemo<MasonryItem[]>(
    () => data.filter(Boolean).map((entryId) => ({ entryId })),
    [data],
  )

  // Force remount when errors happen
  const [forceRemountCounter, setForceRemountCounter] = useState(0)
  const masonryKey = useMemo(
    () => `masonry-${data.length}-${forceRemountCounter}`,
    [data.length, forceRemountCounter],
  )

  // Handle container resize
  useEffect(() => {
    if (!containerRef) return

    const resizeObserver = new ResizeObserver((entries) => {
      const [first] = entries
      if (first) {
        setWidth(first.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef)
    return () => resizeObserver.disconnect()
  }, [containerRef])

  const columnCount = useMemo(() => {
    if (!width) return 1
    return Math.max(1, Math.floor(width / COLUMN_WIDTH))
  }, [width])

  const columnWidth = useMemo(() => {
    if (!width) return COLUMN_WIDTH
    const totalGutter = (columnCount - 1) * GUTTER
    return Math.floor((width - totalGutter) / columnCount)
  }, [width, columnCount])

  const maybeLoadMore = useInfiniteLoader(
    () => {
      if (hasNextPage) endReached()
    },
    {
      isItemLoaded: (index, items) => index < items.length && Boolean(items[index]),
      minimumBatchSize: 24,
      threshold: 6,
    },
  )

  const handleRender = useCallback(
    (startIndex: number, stopIndex: number, items: MasonryItem[]) =>
      maybeLoadMore(startIndex, stopIndex, items as any[]),
    [maybeLoadMore],
  )

  // Mark as read functionality
  const renderMarkRead = useGeneralSettingKey("renderMarkUnread")
  const scrollMarkRead = useGeneralSettingKey("scrollMarkUnread")
  const dataRef = useRefValue(data)
  const currentRange = useRef<{ start: number; end: number } | undefined>(undefined)

  useEffect(() => {
    if (!renderMarkRead && !scrollMarkRead) return
    if (!scrollElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (renderMarkRead) {
          const visibleEntryIds: string[] = []
          entries.forEach(
            ({ isIntersecting, intersectionRatio, boundingClientRect, rootBounds, target }) => {
              if (
                isIntersecting &&
                intersectionRatio >= 0.8 &&
                boundingClientRect.top >= (rootBounds?.top ?? 0)
              ) {
                const { entryId } = (target as HTMLElement).dataset
                if (entryId) visibleEntryIds.push(entryId)
              }
            },
          )
          if (visibleEntryIds.length > 0) {
            batchMarkRead(visibleEntryIds)
          }
        }

        if (scrollMarkRead) {
          let minIndex = Number.MAX_SAFE_INTEGER
          entries.forEach(({ isIntersecting, boundingClientRect, target }) => {
            if (!isIntersecting && boundingClientRect.top < 0) {
              const { index: datasetIndex } = (target as HTMLElement).dataset
              const parsedIndex = Number.parseInt(datasetIndex || "0")
              if (parsedIndex > 0 && parsedIndex <= (currentRange.current?.end ?? 0)) {
                minIndex = Math.min(minIndex, parsedIndex)
              }
            }
          })
          if (minIndex !== Number.MAX_SAFE_INTEGER) {
            batchMarkRead(dataRef.current.slice(0, minIndex))
          }
        }
      },
      {
        root: scrollElement,
        rootMargin: "0px",
        threshold: [0, 0.8, 1],
      },
    )

    return () => observer.disconnect()
  }, [scrollElement, renderMarkRead, scrollMarkRead, dataRef])

  if (!width) {
    return (
      <div ref={setContainerRef} className="mx-4 pt-4">
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div ref={setContainerRef} className="mx-4 pb-8 pt-4">
      <MasonryWrapper
        key={masonryKey}
        items={items}
        columnGutter={GUTTER}
        columnWidth={columnWidth}
        columnCount={columnCount}
        overscanBy={OVERSCAN}
        render={MasonryItemRender}
        onRender={handleRender}
        itemKey={itemKey}
        onError={() => {
          console.info("Forcing remount due to masonry error")
          setForceRemountCounter((prev) => prev + 1)
        }}
      />
      <div className="mt-8">
        {Footer && <div className="mb-4">{typeof Footer === "function" ? <Footer /> : Footer}</div>}
        {hasNextPage && <SkeletonGrid columnCount={columnCount} />}
      </div>
    </div>
  )
}

const itemKey = (item: MasonryItem, index: number) => {
  if (!item || !item.entryId) {
    console.warn("Missing item or entryId at index:", index)
    return `fallback-${index}`
  }
  return item.entryId
}

const MasonryItemRender: React.ComponentType<RenderComponentProps<MasonryItem>> = ({
  data,
  index,
}) => {
  if (!data || !data.entryId) return <LoadingSkeleton count={1} />

  const entry = getEntry(data.entryId)
  if (!entry) return <LoadingSkeleton count={1} />

  return (
    <div
      data-entry-id={data.entryId}
      data-index={index}
      className={clsx(
        "bg-background rounded-lg shadow-sm",
        "transition-all duration-200 hover:shadow-md",
      )}
    >
      <EntryItem entryId={data.entryId} view={FeedViewType.All} />
    </div>
  )
}

const MasonryWrapper: FC<{
  items: MasonryItem[]
  columnGutter: number
  columnWidth: number
  columnCount: number
  overscanBy: number
  render: React.ComponentType<RenderComponentProps<MasonryItem>>
  onRender: (startIndex: number, stopIndex: number, items: MasonryItem[]) => void
  itemKey: (item: MasonryItem, index: number) => string
  onError?: () => void
}> = (props) => {
  const [errorKey, setErrorKey] = useState(0)

  return (
    <ErrorBoundary
      key={errorKey}
      fallback={(errorData) => {
        console.error("Masonry error caught:", errorData.error)
        // Notify parent to force remount
        props.onError?.()
        return (
          <div className="flex items-center justify-center py-8">
            <LoadingSkeleton count={6} />
          </div>
        )
      }}
      beforeCapture={() => {
        setErrorKey((prev) => prev + 1)
      }}
    >
      <Masonry
        items={props.items}
        columnGutter={props.columnGutter}
        columnWidth={props.columnWidth}
        columnCount={props.columnCount}
        overscanBy={props.overscanBy}
        render={props.render}
        onRender={props.onRender}
        itemKey={props.itemKey}
      />
    </ErrorBoundary>
  )
}

// Loading skeleton component
const LoadingSkeleton: FC<{ count?: number }> = ({ count = 1 }) => {
  const keys = useMemo(() => Array.from({ length: count }, () => crypto.randomUUID()), [count])
  return (
    <>
      {keys.map((key) => (
        <div
          key={key}
          className="border-border bg-background mb-4 overflow-hidden rounded-lg border"
        >
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ))}
    </>
  )
}

const SkeletonGrid: FC<{ columnCount: number }> = ({ columnCount }) => {
  const keys = useMemo(
    () => Array.from({ length: columnCount * 2 }, () => crypto.randomUUID()),
    [columnCount],
  )
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
      {keys.map((key) => (
        <div key={key}>
          <LoadingSkeleton count={1} />
        </div>
      ))}
    </div>
  )
}
