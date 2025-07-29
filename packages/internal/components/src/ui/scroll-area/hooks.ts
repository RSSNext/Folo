import clsx from "clsx"
import { useIsomorphicLayoutEffect } from "foxact/use-isomorphic-layout-effect"
import { use, useCallback, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { ScrollElementContext, ScrollElementEventsContext } from "./ctx"

const THRESHOLD = 0
export const useMaskScrollArea = <T extends HTMLElement = HTMLElement>({
  ref,
  size = "base",
  element,
  selector,
}: {
  ref?: React.RefObject<HTMLElement | null>
  element?: HTMLElement
  size?: "base" | "lg"
  selector?: string
} = {}) => {
  const containerRef = useRef<T>(null)
  const [isScrollToBottom, setIsScrollToBottom] = useState(false)
  const [isScrollToTop, setIsScrollToTop] = useState(false)
  const [canScroll, setCanScroll] = useState(false)

  const getDomRef = useCallback(() => {
    let $ = containerRef.current || ref?.current || element

    if (!$) return

    if (selector) {
      $ = $.querySelector(selector) as HTMLElement
    }
    return $
  }, [ref, selector, element])
  const eventHandler = useEventCallback(() => {
    const $ = getDomRef()

    if (!$) return

    // if $ can not scroll
    if ($.scrollHeight <= $.clientHeight + 2) {
      setCanScroll(false)
      setIsScrollToBottom(false)
      setIsScrollToTop(false)
      return
    }

    setCanScroll(true)

    // if $ can scroll
    const isScrollToBottom = $.scrollTop + $.clientHeight >= $.scrollHeight - THRESHOLD
    const isScrollToTop = $.scrollTop <= THRESHOLD
    setIsScrollToBottom(isScrollToBottom)
    setIsScrollToTop(isScrollToTop)
  })
  useIsomorphicLayoutEffect(() => {
    const $ = getDomRef()
    if (!$) return

    $.addEventListener("scroll", eventHandler)

    return () => {
      $.removeEventListener("scroll", eventHandler)
    }
  }, [eventHandler, getDomRef, element])

  useIsomorphicLayoutEffect(() => {
    if (!ref?.current) {
      return
    }
    const $ = ref.current
    const resizeObserver = new ResizeObserver(() => {
      eventHandler()
    })
    eventHandler()
    resizeObserver.observe($)
    return () => {
      resizeObserver.disconnect()
    }
  }, [eventHandler, element])

  const postfixSize = {
    base: "",
    lg: "-lg",
  }[size]

  return [
    containerRef,
    canScroll
      ? clsx(
          isScrollToBottom && "mask-t",
          isScrollToTop && "mask-b",
          !isScrollToBottom && !isScrollToTop && "mask-both",
        ) + postfixSize
      : "",
  ] as const
}

/**
 * Get the scroll area element when in radix scroll area
 * @returns
 */
export const useScrollViewElement = () => use(ScrollElementContext)

export const useScrollElementUpdate = () => use(ScrollElementEventsContext)
