import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import type { FC, RefObject } from "react"
import { memo, startTransition, useEffect, useRef, useState } from "react"

import { EntrySubscriptionSkeleton } from "./components/EntrySubscriptionSkeleton"
import { useEntriesContext } from "./context/EntriesContext"
import { EntrySubscriptionItem } from "./EntrySubscriptionItem"
import { useEntryVirtualizer } from "./hooks/subscription/useEntryVirtualizer"

export interface EntrySubscriptionListProps {
  scrollToEntryId?: string
}

// Prevent scroll list move when press up/down key
const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault()
  }
}

export const EntrySubscriptionList: FC<EntrySubscriptionListProps> = memo(({ scrollToEntryId }) => {
  // Use shared context exclusively to guarantee full synchronization
  const { entriesIds, hasNextPage, isFetchingNextPage, fetchNextPage, view } = useEntriesContext()

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Handle virtualization internally
  const { rowVirtualizer, renderData, totalSize, scrollToEntry } = useEntryVirtualizer({
    entriesIds,
    scrollElement: scrollAreaRef as RefObject<HTMLElement>,
  })

  // Handle infinite loading
  useEffect(() => {
    const lastRenderItem = renderData.at(-1)
    if (!lastRenderItem) return

    if (lastRenderItem.isLoaderRow && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [renderData, hasNextPage, isFetchingNextPage, fetchNextPage])

  const [ready, setReady] = useState(false)

  useEffect(() => {
    startTransition(() => {
      setReady(true)
    })
  }, [])
  useEffect(() => {
    if (scrollToEntryId) {
      scrollToEntry(scrollToEntryId)
    }
  }, [scrollToEntryId, scrollToEntry])
  return (
    <ScrollArea rootClassName="h-0 grow" ref={scrollAreaRef}>
      <div
        onKeyDown={handleKeyDown}
        className="relative w-full select-none"
        style={{
          height: `${totalSize}px`,
        }}
      >
        {renderData.map((item) => {
          if (!ready) return null

          if (item.isLoaderRow) {
            const Content = hasNextPage ? <EntrySubscriptionSkeleton count={3} /> : null

            return (
              <div
                ref={rowVirtualizer.measureElement}
                className="absolute left-0 top-0 w-full will-change-transform"
                key={item.key}
                data-index={item.index}
                style={{
                  transform: item.transform,
                }}
              >
                {Content}
              </div>
            )
          }

          return (
            <div
              key={item.key}
              className="absolute left-0 top-0 w-full will-change-transform"
              style={{ transform: item.transform }}
              ref={rowVirtualizer.measureElement}
              data-index={item.index}
            >
              <EntrySubscriptionItem entryId={item.entryId!} view={view} />
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
})

EntrySubscriptionList.displayName = "EntrySubscriptionList"
