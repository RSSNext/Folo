import { useMobile } from "@follow/components/hooks/useMobile.js"
import {
  MasonryIntersectionContext,
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
} from "@follow/components/ui/masonry/contexts.jsx"
import { useMasonryColumn } from "@follow/components/ui/masonry/hooks.js"
import { Masonry } from "@follow/components/ui/masonry/index.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { useRefValue } from "@follow/hooks"
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

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { MediaContainerWidthProvider } from "~/components/ui/media"
import { useEntryTranslation } from "~/store/ai/hook"
import { getEntry } from "~/store/entry"
import { imageActions } from "~/store/image"

import { getMasonryColumnValue, setMasonryColumnValue, useMasonryColumnValue } from "../atoms"
import { batchMarkRead } from "../hooks/useEntryMarkReadHandler"
import { PictureWaterFallItem } from "./picture-item"

// grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4 @7xl:grid-cols-5 px-4 gap-1.5

const FirstScreenItemCount = 20
const FirstScreenReadyCountDown = 150
const FirstScreenReadyContext = createContext(false)
const gutter = 24

export const PictureMasonry: FC<MasonryProps> = (props) => {
  const { data } = props
  const isMobile = useMobile()
  const cacheMap = useState(() => new Map<string, object>())[0]
  const [isInitDim, setIsInitDim] = useState(false)
  const [isInitLayout, setIsInitLayout] = useState(false)
  const deferIsInitLayout = useDeferredValue(isInitLayout)
  const restoreDimensions = useEventCallback(async () => {
    const images = [] as string[]
    data.forEach((entryId) => {
      const entry = getEntry(entryId)
      if (!entry) return

      images.push(...imageActions.getImagesFromEntry(entry.entries))
    })
    return imageActions.fetchDimensionsFromDb(images)
  })
  useLayoutEffect(() => {
    restoreDimensions().finally(() => {
      startTransition(() => {
        setIsInitDim(true)
      })
    })
  }, [])

  const customizeColumn = useMasonryColumnValue()
  const { containerRef, currentColumn, currentItemWidth, calcItemWidth } = useMasonryColumn(
    gutter,
    (column) => {
      setIsInitLayout(true)
      if (getMasonryColumnValue() === -1) {
        setMasonryColumnValue(column)
      }
    },
  )

  const finalColumn = customizeColumn !== -1 && !isMobile ? customizeColumn : currentColumn
  const finalItemWidth = useMemo(
    () => (customizeColumn !== -1 ? calcItemWidth(finalColumn) : currentItemWidth),
    [calcItemWidth, currentItemWidth, customizeColumn, finalColumn],
  )

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

    if (props.hasNextPage) {
      for (let i = 0; i < 10; i++) {
        result.push({
          entryId: `placeholder${i}`,
        })
      }
    }

    return result
  }, [cacheMap, data, props.hasNextPage])

  const [masonryItemsRadio, setMasonryItemsRadio] = useState<Record<string, number>>({})
  const maybeLoadMore = useInfiniteLoader(props.endReached, {
    isItemLoaded: (index, items) => !!items[index],
    minimumBatchSize: 32,
    threshold: 3,
  })

  const currentRange = useRef<{ start: number; end: number }>(undefined)
  const handleRender = useCallback(
    (startIndex: number, stopIndex: number, items: any[]) => {
      currentRange.current = { start: startIndex, end: stopIndex }
      return maybeLoadMore(startIndex, stopIndex, items)
    },
    [maybeLoadMore],
  )
  const scrollElement = useScrollViewElement()

  const [intersectionObserver, setIntersectionObserver] = useState<IntersectionObserver>(null!)
  const renderMarkRead = useGeneralSettingKey("renderMarkUnread")
  const scrollMarkRead = useGeneralSettingKey("scrollMarkUnread")

  const dataRef = useRefValue(data)
  useEffect(() => {
    if (!renderMarkRead && !scrollMarkRead) return
    if (!scrollElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        renderInViewMarkRead(entries)
        scrollOutViewMarkRead(entries)

        function scrollOutViewMarkRead(entries: IntersectionObserverEntry[]) {
          if (!scrollMarkRead) return
          if (!scrollElement) return
          let minimumIndex = Number.MAX_SAFE_INTEGER
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
              // if index is 0, or not a number, then skip
              if (!currentIndex) return
              // It is possible that the end coordinates beyond the overscan range are still being calculated and the position is not actually determined. Filtering here
              if (currentIndex > (currentRange.current?.end ?? 0)) {
                return
              }

              minimumIndex = Math.min(minimumIndex, currentIndex)
            }
          })

          if (minimumIndex !== Number.MAX_SAFE_INTEGER) {
            batchMarkRead(dataRef.current.slice(0, minimumIndex))
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
  }, [scrollElement, renderMarkRead, scrollMarkRead, dataRef])

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

  return (
    <div ref={containerRef} className="mx-4 pt-2">
      {isInitDim && deferIsInitLayout && (
        <MasonryItemWidthContext value={finalItemWidth}>
          {/* eslint-disable-next-line @eslint-react/no-context-provider */}
          <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
            <MasonryItemsAspectRatioSetterContext value={setMasonryItemsRadio}>
              <MasonryIntersectionContext value={intersectionObserver}>
                <MediaContainerWidthProvider width={finalItemWidth}>
                  <FirstScreenReadyContext value={firstScreenReady}>
                    <Masonry
                      items={firstScreenReady ? items : items.slice(0, FirstScreenItemCount)}
                      columnGutter={gutter}
                      columnWidth={finalItemWidth}
                      columnCount={finalColumn}
                      overscanBy={2}
                      render={MasonryRender}
                      onRender={handleRender}
                      itemKey={itemKey}
                    />
                    {props.Footer ? (
                      typeof props.Footer === "function" ? (
                        <div className="mb-4">
                          <props.Footer />
                        </div>
                      ) : (
                        <div className="mb-4">{props.Footer}</div>
                      )
                    ) : null}
                  </FirstScreenReadyContext>
                </MediaContainerWidthProvider>
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
  const translation = useEntryTranslation({ entryId: data.entryId })

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
      translation={translation.data}
    />
  )
}
interface MasonryProps {
  data: string[]
  endReached: () => any
  hasNextPage: boolean
  Footer?: FC | ReactNode
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
