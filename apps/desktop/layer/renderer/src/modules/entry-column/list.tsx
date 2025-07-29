import { EmptyIcon } from "@follow/components/icons/empty.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import type { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { LRUCache } from "@follow/utils/lru-cache"
import type { Range, VirtualItem, Virtualizer } from "@tanstack/react-virtual"
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual"
import type { HTMLMotionProps } from "motion/react"
import type { FC, MutableRefObject, ReactNode } from "react"
import { memo, startTransition, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useEventCallback } from "usehooks-ts"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { m } from "~/components/common/Motion"

import { VirtualRowItem } from "./components/VirtualRowItem"
import { EntryColumnShortcutHandler } from "./EntryColumnShortcutHandler"
import { EntryItemSkeleton } from "./EntryItemSkeleton"

export const EntryEmptyList = ({
  ref,
  ...props
}: HTMLMotionProps<"div"> & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const { t } = useTranslation()
  return (
    <m.div
      className="absolute -mt-6 flex size-full grow flex-col items-center justify-center gap-2 text-zinc-400"
      {...props}
      ref={ref}
    >
      {unreadOnly ? (
        <>
          <i className="i-mgc-celebrate-cute-re -mt-11 text-3xl" />
          <span className="text-base">{t("entry_list.zero_unread")}</span>
        </>
      ) : (
        <div className="flex -translate-y-6 flex-col items-center justify-center gap-2">
          <EmptyIcon className="size-[30px]" />
          <span className="text-base">{t("words.zero_items")}</span>
        </div>
      )}
    </m.div>
  )
}

export type EntryListProps = {
  feedId: string
  entriesIds: string[]
  view: FeedViewType

  hasNextPage: boolean
  fetchNextPage: () => void
  refetch: () => void

  groupCounts?: number[]
  gap?: number

  Footer?: FC | ReactNode

  onRangeChange?: (range: Range) => void

  listRef?: MutableRefObject<Virtualizer<HTMLElement, Element> | undefined>
}

const capacity = 3
const offsetCache = new LRUCache<string, number>(capacity)
const measurementsCache = new LRUCache<string, VirtualItem[]>(capacity)
// Prevent scroll list move when press up/down key, the up/down key should be taken over by the shortcut key we defined.
const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault()
  }
}
export const EntryList: FC<EntryListProps> = memo(
  ({
    feedId,
    view,
    entriesIds,
    fetchNextPage,
    refetch,
    hasNextPage,
    groupCounts,
    Footer,
    listRef,
    onRangeChange,
    gap,
  }) => {
    const scrollRef = useScrollViewElement()

    const stickyIndexes = useMemo(
      () =>
        groupCounts
          ? groupCounts.reduce(
              (acc, count, index) => {
                acc[index + 1] = acc[index]! + count
                return acc
              },
              [0],
            )
          : [],
      [groupCounts],
    )

    const cacheKey = `${view}-${feedId}`
    const rowVirtualizer = useVirtualizer({
      count: entriesIds.length + 1,
      estimateSize: () => 112,
      overscan: 5,
      gap,
      getScrollElement: () => scrollRef,
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
      rangeExtractor: useTypeScriptHappyCallback(
        (range: Range) => {
          activeStickyIndexRef.current =
            [...stickyIndexes].reverse().find((index) => range.startIndex >= index) ?? 0

          const next = new Set([activeStickyIndexRef.current, ...defaultRangeExtractor(range)])

          return [...next].sort((a, b) => a - b)
        },
        [stickyIndexes],
      ),
    })

    useEffect(() => {
      if (!listRef) return
      listRef.current = rowVirtualizer
    }, [rowVirtualizer, listRef])

    const handleScrollTo = useEventCallback((index: number) => {
      rowVirtualizer.scrollToIndex(index)
    })

    const activeStickyIndexRef = useRef(0)
    const checkIsActiveSticky = (index: number) => activeStickyIndexRef.current === index
    const checkIsStickyItem = (index: number) => stickyIndexes.includes(index)

    const virtualItems = rowVirtualizer.getVirtualItems()
    useEffect(() => {
      const lastItem = virtualItems.at(-1)

      if (!lastItem) {
        return
      }

      const isPlaceholderRow = lastItem.index === entriesIds.length

      if (isPlaceholderRow && hasNextPage) {
        fetchNextPage()
      }
    }, [entriesIds.length, fetchNextPage, hasNextPage, virtualItems])

    const [isScrollTop, setIsScrollTop] = useState(true)

    useEffect(() => {
      const $scrollRef = scrollRef
      if (!$scrollRef) return
      const handleScroll = () => {
        setIsScrollTop($scrollRef.scrollTop <= 0)
      }
      $scrollRef.addEventListener("scroll", handleScroll)

      return () => {
        $scrollRef.removeEventListener("scroll", handleScroll)
      }
    }, [scrollRef])

    const [ready, setReady] = useState(false)

    useEffect(() => {
      startTransition(() => {
        setReady(true)
      })
    }, [])

    return (
      <>
        <div
          onKeyDown={handleKeyDown}
          className={"relative mt-3 w-full select-none"}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            if (!ready) return null
            // Last placeholder row
            const isLoaderRow = virtualRow.index === entriesIds.length

            const transform = `translateY(${virtualRow.start}px)`
            if (isLoaderRow) {
              const Content = hasNextPage ? (
                <EntryItemSkeleton view={view} count={6} />
              ) : Footer ? (
                typeof Footer === "function" ? (
                  <Footer />
                ) : (
                  Footer
                )
              ) : null

              return (
                <div
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 top-0 w-full will-change-transform"
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    transform,
                  }}
                >
                  {Content}
                </div>
              )
            }
            const isStickyItem = checkIsStickyItem(virtualRow.index)
            const isActiveStickyItem = !isScrollTop && checkIsActiveSticky(virtualRow.index)
            return (
              <VirtualRowItem
                key={virtualRow.key}
                virtualRowKey={virtualRow.key}
                entriesIds={entriesIds}
                virtualRowIndex={virtualRow.index}
                view={view}
                transform={transform}
                isStickyItem={isStickyItem}
                isActiveStickyItem={isActiveStickyItem}
                measureElement={rowVirtualizer.measureElement}
              />
            )
          })}
        </div>

        <EntryColumnShortcutHandler
          refetch={refetch}
          data={entriesIds}
          handleScrollTo={handleScrollTo}
        />
      </>
    )
  },
)
