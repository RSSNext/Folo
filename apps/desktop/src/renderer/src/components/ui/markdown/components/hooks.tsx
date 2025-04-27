import { getViewport } from "@follow/components/hooks/useViewport.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { getElementTop } from "@follow/utils/dom"
import { springScrollToElement } from "@follow/utils/scroller"
import { throttle } from "es-toolkit/compat"
import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useEventCallback } from "usehooks-ts"

import {
  useGetWrappedElementPosition,
  useWrappedElementSize,
} from "~/providers/wrapped-element-provider"

import type { ITocItem, TocProps } from "./Toc"

// Hooks
export const useTocItems = (markdownElement: HTMLElement | null) => {
  const queryToCItems = useCallback(
    (): HTMLHeadingElement[] =>
      Array.from(markdownElement?.querySelectorAll("h1, h2, h3, h4, h5, h6") || []),
    [markdownElement],
  )
  const [$headings, setHeadings] = useState(queryToCItems)

  useEffect(() => {
    setHeadings(queryToCItems())
  }, [markdownElement, queryToCItems])

  const toc: ITocItem[] = useMemo(
    () =>
      Array.from($headings).map((el, idx) => {
        const depth = +el.tagName.slice(1)
        const elClone = el.cloneNode(true) as HTMLElement
        const title = elClone.textContent || ""
        const index = idx

        return {
          depth,
          index: Number.isNaN(index) ? -1 : index,
          title,
          anchorId: el.dataset.rid || "",
          $heading: el,
        }
      }),
    [$headings],
  )

  const rootDepth = useMemo(
    () =>
      toc?.length
        ? (toc.reduce(
            (d: number, cur) => Math.min(d, cur.depth),
            toc[0]?.depth || 0,
          ) as any as number)
        : 0,
    [toc],
  )

  return {
    toc,
    rootDepth,
    refreshItems: useCallback(() => {
      setHeadings(queryToCItems())
    }, [queryToCItems]),
  }
}

type DebouncedFuncLeading<T extends (..._args: any[]) => any> = T & {
  cancel: () => void
  flush: () => void
}

export const useScrollTracking = (
  toc: ITocItem[],
  options: Pick<TocProps, "onItemClick"> & {
    useWindowScroll?: boolean
  },
) => {
  const _scrollContainerElement = useScrollViewElement()
  const scrollContainerElement = options.useWindowScroll ? document : _scrollContainerElement
  const [currentScrollRange, setCurrentScrollRange] = useState([-1, 0] as [number, number])
  const { h } = useWrappedElementSize()

  const getWrappedElPos = useGetWrappedElementPosition()

  const headingRangeParser = useCallback(() => {
    // calculate the range of data-container-top between each two headings
    const titleBetweenPositionTopRangeMap = [] as [number, number][]
    for (let i = 0; i < toc.length - 1; i++) {
      const { $heading } = toc[i]!
      const $nextHeading = toc[i + 1]!.$heading

      const headingTop =
        Number.parseInt($heading.dataset["containerTop"] || "0") || getElementTop($heading)
      if (!$heading.dataset) {
        // @ts-expect-error
        $heading.dataset["containerTop"] = headingTop.toString()
      }

      const nextTop = getElementTop($nextHeading)
      if (!$nextHeading.dataset) {
        // @ts-expect-error
        $nextHeading.dataset["containerTop"] = nextTop.toString()
      }

      titleBetweenPositionTopRangeMap.push([headingTop, nextTop])
    }
    return titleBetweenPositionTopRangeMap
  }, [toc])

  const headingRangeParserEvent = useEventCallback(headingRangeParser)

  const [titleBetweenPositionTopRangeMap, setTitleBetweenPositionTopRangeMap] =
    useState(headingRangeParser)

  useLayoutEffect(() => {
    startTransition(() => {
      setTitleBetweenPositionTopRangeMap(headingRangeParserEvent)
    })
  }, [toc, h, headingRangeParserEvent])

  const throttleCallerRef = useRef<DebouncedFuncLeading<() => void>>()

  useEffect(() => {
    if (!scrollContainerElement) return

    const handler = throttle(() => {
      const { y } = getWrappedElPos()

      const top =
        scrollContainerElement === document
          ? document.documentElement.scrollTop + y
          : (scrollContainerElement as HTMLElement).scrollTop + y

      const winHeight = getViewport().h
      const deltaHeight = top >= winHeight ? winHeight : (top / winHeight) * winHeight

      const actualTop = Math.floor(Math.max(0, top - y + deltaHeight)) || 0

      // current top is in which range?
      const currentRangeIndex = titleBetweenPositionTopRangeMap.findIndex(
        ([start, end]) => actualTop >= start && actualTop <= end,
      )
      const currentRange = titleBetweenPositionTopRangeMap[currentRangeIndex]

      if (currentRange) {
        const [start, end] = currentRange

        // current top is this range, the precent is ?
        const precent = (actualTop - start) / (end - start)

        // position , precent
        setCurrentScrollRange([currentRangeIndex, precent])
      } else {
        const last = titleBetweenPositionTopRangeMap.at(-1) || [0, 0]

        if (top + winHeight > last[1]) {
          setCurrentScrollRange([
            titleBetweenPositionTopRangeMap.length,
            1 - (last[1] - top) / winHeight,
          ])
        } else {
          setCurrentScrollRange([-1, 1])
        }
      }
    }, 100)

    throttleCallerRef.current = handler
    scrollContainerElement.addEventListener("scroll", handler)

    return () => {
      scrollContainerElement.removeEventListener("scroll", handler)
      handler.cancel()
    }
  }, [getWrappedElPos, scrollContainerElement, titleBetweenPositionTopRangeMap])

  const handleScrollTo = useEventCallback(
    (i: number, $el: HTMLElement | null, _anchorId: string) => {
      options.onItemClick?.(i, $el, _anchorId)
      if ($el) {
        const handle = () => {
          springScrollToElement(
            $el,
            -100,
            scrollContainerElement === document
              ? undefined
              : (scrollContainerElement as HTMLElement),
          ).then(() => {
            throttleCallerRef.current?.cancel()
            setTimeout(() => {
              setCurrentScrollRange([i, 1])
            }, 36)
          })
        }
        handle()
      }
    },
  )

  return { currentScrollRange, handleScrollTo }
}
