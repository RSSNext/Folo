import { getViewport } from "@follow/components/hooks/useViewport.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { getElementTop } from "@follow/utils/dom"
import { springScrollToElement } from "@follow/utils/scroller"
import { throttle } from "es-toolkit/compat"
import { useStore } from "jotai"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

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

  const headingTopsRef = useRef<number[]>([])
  const [headingTopsVersion, setHeadingTopsVersion] = useState(0)
  const throttleCallerRef = useRef<DebouncedFuncLeading<() => void>>(undefined)
  const store = useStore()

  useLayoutEffect(() => {
    if (!scrollContainerElement || toc.length === 0) {
      headingTopsRef.current = []
      setHeadingTopsVersion((v) => v + 1)
      return
    }

    const scrollContainerTop =
      scrollContainerElement === document ? 0 : getElementTop(scrollContainerElement as HTMLElement)

    const tops = toc.map(({ $heading }) => {
      const elementTop = getElementTop($heading)
      const top = elementTop - scrollContainerTop
      return top
    })

    headingTopsRef.current = tops
    setHeadingTopsVersion((v) => v + 1)
  }, [toc, scrollContainerElement])

  useEffect(() => {
    if (!scrollContainerElement || toc.length === 0) return

    const handler = throttle(() => {
      const storeViewport = getViewport(store)
      const winHeight = storeViewport.h
      const headingTops = headingTopsRef.current

      if (headingTops.length === 0) return

      const scrollTop =
        scrollContainerElement === document
          ? document.documentElement.scrollTop
          : (scrollContainerElement as HTMLElement).scrollTop

      const activationLine = scrollTop + winHeight / 3

      let activeIndex = -1
      for (let i = headingTops.length - 1; i >= 0; i--) {
        if (activationLine >= headingTops[i]!) {
          activeIndex = i
          break
        }
      }

      if (activeIndex === -1) {
        setCurrentScrollRange([-1, 0])
      } else if (activeIndex === headingTops.length - 1) {
        const lastHeadingTop = headingTops[activeIndex]!
        const contentEnd =
          scrollContainerElement === document
            ? document.documentElement.scrollHeight
            : (scrollContainerElement as HTMLElement).scrollHeight

        const total = contentEnd - lastHeadingTop
        const current = activationLine - lastHeadingTop
        const progress = Math.min(1, Math.max(0, total > 0 ? current / total : 0))
        setCurrentScrollRange([activeIndex, progress])
      } else {
        const currentHeadingTop = headingTops[activeIndex]!
        const nextHeadingTop = headingTops[activeIndex + 1]!
        const total = nextHeadingTop - currentHeadingTop
        const current = activationLine - currentHeadingTop
        const progress = Math.min(1, Math.max(0, total > 0 ? current / total : 0))
        setCurrentScrollRange([activeIndex, progress])
      }
    }, 100)

    throttleCallerRef.current = handler

    handler()

    scrollContainerElement.addEventListener("scroll", handler, { passive: true })

    return () => {
      scrollContainerElement.removeEventListener("scroll", handler)
      handler.cancel()
    }
  }, [scrollContainerElement, store, toc, headingTopsVersion])

  const handleScrollTo = useEventCallback(
    (i: number, $el: HTMLElement | null, _anchorId: string) => {
      options.onItemClick?.(i, $el, _anchorId)
      if ($el && scrollContainerElement) {
        springScrollToElement(
          $el,
          -100,
          scrollContainerElement === document ? undefined : (scrollContainerElement as HTMLElement),
        ).then(() => {
          throttleCallerRef.current?.cancel()
          setTimeout(() => {
            throttleCallerRef.current?.()
          }, 50)
        })
      }
    },
  )

  return { currentScrollRange, handleScrollTo }
}
