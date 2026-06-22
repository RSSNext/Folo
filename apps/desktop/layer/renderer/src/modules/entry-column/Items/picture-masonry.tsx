import {
  MasonryForceRerenderContext,
  MasonryIntersectionContext,
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
} from "@follow/components/ui/masonry/contexts.jsx"
import { useMasonryColumn } from "@follow/components/ui/masonry/hooks.js"
import { Masonry } from "@follow/components/ui/masonry/index.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { useRefValue, useScrollMarkReadGracePeriod } from "@follow/hooks"
import {
  getScrollMarkReadExitedSliceEnd,
  shouldRenderScrollMarkReadEndSpacer,
} from "@follow/shared/scroll-mark-read"
import { getEntry } from "@follow/store/entry/getter"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { clsx } from "@follow/utils/utils"
import type { RenderComponentProps } from "masonic"
import { useInfiniteLoader } from "masonic"
import type { FC, ReactNode } from "react"
import {
  createContext,
  startTransition,
  use,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useEventCallback } from "usehooks-ts"

import { useActionLanguage, useGeneralSettingKey } from "~/atoms/settings/general"
import { useUISettingKey } from "~/atoms/settings/ui"
import { MediaContainerWidthProvider } from "~/components/ui/media/MediaContainerWidthProvider"
import type { StoreImageType } from "~/store/image"
import { imageActions } from "~/store/image"

import { useEntriesState } from "../context/EntriesContext"
import { batchMarkRead } from "../hooks/useEntryMarkReadHandler"
import { useScrollMarkReadEndPadding } from "../hooks/useScrollMarkReadEndPadding"
import { shouldApplyScrollResetSignal } from "../scroll-reset"
import { PictureWaterFallItem } from "./picture-item"

// grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4 @7xl:grid-cols-5 px-4 gap-1.5

const FirstScreenItemCount = 20
const FirstScreenReadyCountDown = 150
const FirstScreenReadyContext = createContext(false)
const gutter = 24

export const PictureMasonry: FC<MasonryProps> = (props) => {
  const { appliedResetScrollSignal, data, onResetScrollSignalConsumed, resetScrollSignal } = props
  const entriesState = useEntriesState()
  const pauseScrollMarkRead = useScrollMarkReadGracePeriod(
    entriesState.isFetching && !entriesState.isFetchingNextPage,
  )
  const cacheMap = useState(() => new Map<string, object>())[0]
  const [isInitDim, setIsInitDim] = useState(false)
  const [isInitLayout, setIsInitLayout] = useState(false)
  const deferIsInitLayout = useDeferredValue(isInitLayout)
  const restoreDimensions = useEventCallback(async () => {
    const images = [] as string[]

    data.forEach((entryId) => {
      const entry = getEntry(entryId)
      if (!entry) return

      images.push(...imageActions.getImagesFromEntry(entry))
    })
    return imageActions.fetchDimensionsFromDb(images)
  })
  useLayoutEffect(() => {
    restoreDimensions().finally(() => {
      startTransition(() => {
        setIsInitDim(true)
      })
    })
  }, [restoreDimensions])

  useLayoutEffect(() => {
    const images: StoreImageType[] = []
    data.forEach((entryId) => {
      const entry = getEntry(entryId)
      if (!entry) return

      if (!entry.media) return
      for (const media of entry.media) {
        if (!media.height || !media.width) continue

        images.push({
          src: media.url,
          width: media.width,
          height: media.height,
          ratio: media.width / media.height,
        })
      }
    })
    if (images.length > 0) {
      imageActions.saveImages(images)
    }
  }, [JSON.stringify(data)])

  const { containerRef, currentColumn, currentItemWidth } = useMasonryColumn(gutter, () => {
    setIsInitLayout(true)
  })

  const items = useMemo(() => {
    const result = data.map((entryId) => {
      const cache = cacheMap.get(entryId)
      if (cache) {
        return cache
      }

      const ret = { entryId }
      cacheMap.set(entryId, ret)
      return ret
    }) as { entryId: string; cache?: object }[]

    // Disable placeholders in waterfall to prevent layout redraws on last page
    // if (props.hasNextPage) {
    //   for (let i = 0; i < 10; i++) {
    //     result.push({
    //       entryId: `placeholder${i}`,
    //     })
    //   }
    // }

    return result
  }, [cacheMap, data, props.hasNextPage])

  const [masonryItemsRadio, setMasonryItemsRadio] = useState<Record<string, number>>({})
  const maybeLoadMore = useInfiniteLoader(props.endReached, {
    isItemLoaded: (index, items) => !!items[index],
    minimumBatchSize: 32,
    threshold: 3,
  })

  const currentRange = useRef<{ start: number; end: number }>(undefined)
  const scrollElement = useScrollViewElement()
  const hasEndSpacer = shouldRenderScrollMarkReadEndSpacer({
    entryCount: data.length,
    hasNextPage: props.hasNextPage,
  })
  const endSpacerHeight = useScrollMarkReadEndPadding(scrollElement, hasEndSpacer)
  const isResetScrollPending = shouldApplyScrollResetSignal({
    resetSignal: resetScrollSignal,
    appliedResetSignal: appliedResetScrollSignal,
  })
  useLayoutEffect(() => {
    if (!scrollElement) return
    if (!isInitDim || !deferIsInitLayout) return
    if (!isResetScrollPending) return
    if (resetScrollSignal === undefined) return

    scrollElement.scrollTop = 0
    scrollElement.scrollLeft = 0
    onResetScrollSignalConsumed?.(resetScrollSignal)
  }, [
    onResetScrollSignalConsumed,
    deferIsInitLayout,
    isInitDim,
    isResetScrollPending,
    resetScrollSignal,
    scrollElement,
  ])
  const handleRender = useCallback(
    (startIndex: number, stopIndex: number, items: any[]) => {
      currentRange.current = { start: startIndex, end: stopIndex }
      return maybeLoadMore(startIndex, stopIndex, items)
    },
    [maybeLoadMore],
  )

  const [intersectionObserver, setIntersectionObserver] = useState<IntersectionObserver>(null!)
  const renderMarkRead = useGeneralSettingKey("renderMarkUnread")
  const scrollMarkRead = useGeneralSettingKey("scrollMarkUnread")

  const dataRef = useRefValue(data)
  useEffect(() => {
    if (!renderMarkRead && !scrollMarkRead) return
    if (props.suspendMarkRead) return
    if (!scrollElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        renderInViewMarkRead(entries)
        scrollOutViewMarkRead(entries)

        function scrollOutViewMarkRead(entries: IntersectionObserverEntry[]) {
          if (!scrollMarkRead) return
          if (pauseScrollMarkRead) return
          if (!scrollElement) return
          const exitedIndexes: number[] = []
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              return
            }
            const $target = entry.target as HTMLDivElement
            const $targetScrollTop = $target.getBoundingClientRect().top

            if ($targetScrollTop < 0) {
              const { index } = (entry.target as HTMLDivElement).dataset
              if (!index) return
              const currentIndex = Number.parseInt(index)
              exitedIndexes.push(currentIndex)
            }
          })

          const exitedSliceEnd = getScrollMarkReadExitedSliceEnd({
            indexes: exitedIndexes,
            renderedEndIndex: currentRange.current?.end,
          })

          if (exitedSliceEnd !== null) {
            batchMarkRead(dataRef.current.slice(0, exitedSliceEnd))
          }
        }

        function renderInViewMarkRead(entries: IntersectionObserverEntry[]) {
          if (!renderMarkRead) return
          const entryIds: string[] = []
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.8 &&
              entry.boundingClientRect.top >= entry.rootBounds!.top
            ) {
              entryIds.push((entry.target as HTMLDivElement).dataset.entryId as string)
            }
          })

          batchMarkRead(entryIds)
        }
      },
      {
        rootMargin: "0px",
        threshold: [0, 1],
        root: scrollElement,
      },
    )
    setIntersectionObserver(observer)
    return () => {
      observer.disconnect()
    }
  }, [
    dataRef,
    pauseScrollMarkRead,
    props.suspendMarkRead,
    renderMarkRead,
    scrollElement,
    scrollMarkRead,
  ])

  const [firstScreenReady, setFirstScreenReady] = useState(false)
  useEffect(() => {
    if (firstScreenReady) return
    const timer = setTimeout(() => {
      setFirstScreenReady(true)
    }, FirstScreenReadyCountDown)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const isImageOnly = useUISettingKey("pictureViewImageOnly")
  const [masonryForceRerender, setMasonrtForceRerender] = useState(0)
  useEffect(() => {
    setMasonrtForceRerender((i) => i + 1)
  }, [isImageOnly, setMasonrtForceRerender])

  return (
    <div ref={containerRef} className="mx-4 pt-4">
      {isInitDim && deferIsInitLayout && (
        <MasonryItemWidthContext value={currentItemWidth}>
          {/* eslint-disable-next-line @eslint-react/no-context-provider */}
          <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
            <MasonryItemsAspectRatioSetterContext value={setMasonryItemsRadio}>
              <MasonryIntersectionContext value={intersectionObserver}>
                <MasonryForceRerenderContext value={masonryForceRerender}>
                  <MediaContainerWidthProvider width={currentItemWidth}>
                    <FirstScreenReadyContext value={firstScreenReady}>
                      <Masonry
                        items={firstScreenReady ? items : items.slice(0, FirstScreenItemCount)}
                        columnGutter={gutter}
                        columnWidth={currentItemWidth}
                        columnCount={currentColumn}
                        overscanBy={2}
                        render={MasonryRender}
                        onRender={handleRender}
                        itemKey={itemKey}
                      />
                      {props.Footer ? (
                        typeof props.Footer === "function" ? (
                          <div className={hasEndSpacer ? undefined : "mb-4"}>
                            <props.Footer />
                          </div>
                        ) : (
                          <div className={hasEndSpacer ? undefined : "mb-4"}>{props.Footer}</div>
                        )
                      ) : null}
                      {hasEndSpacer && (
                        <div
                          aria-hidden
                          className="pointer-events-none"
                          style={{ height: `${endSpacerHeight}px` }}
                        />
                      )}
                    </FirstScreenReadyContext>
                  </MediaContainerWidthProvider>
                </MasonryForceRerenderContext>
              </MasonryIntersectionContext>
            </MasonryItemsAspectRatioSetterContext>
          </MasonryItemsAspectRatioContext.Provider>
        </MasonryItemWidthContext>
      )}
    </div>
  )
}

const itemKey = (item: { entryId: string }) => item.entryId
const MasonryRender: React.ComponentType<
  RenderComponentProps<{
    entryId: string
  }>
> = ({ data, index }) => {
  const firstScreenReady = use(FirstScreenReadyContext)
  const enableTranslation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  const translation = useEntryTranslation({
    entryId: data.entryId,
    language: actionLanguage,
    enabled: enableTranslation,
  })

  if (data.entryId.startsWith("placeholder")) {
    return <LoadingSkeletonItem />
  }

  return (
    <PictureWaterFallItem
      className={clsx(
        firstScreenReady ? "opacity-100" : "opacity-0",
        "transition-opacity duration-200",
      )}
      entryId={data.entryId}
      index={index}
      translation={translation}
    />
  )
}
interface MasonryProps {
  data: string[]
  endReached: () => any
  hasNextPage: boolean
  Footer?: FC | ReactNode
  appliedResetScrollSignal?: number
  onResetScrollSignalConsumed?: (signal: number) => void
  resetScrollSignal?: number
  suspendMarkRead?: boolean
}

const LoadingSkeletonItem = () => {
  // random height, between 100-400px
  const randomHeight = useState(() => Math.random() * 300 + 100)[0]
  return (
    <div className="relative flex gap-2 overflow-x-auto">
      <div
        className="relative flex w-full shrink-0 items-center overflow-hidden rounded-md"
        style={{ height: `${randomHeight}px` }}
      >
        <Skeleton className="size-full overflow-hidden" />
      </div>
    </div>
  )
}
