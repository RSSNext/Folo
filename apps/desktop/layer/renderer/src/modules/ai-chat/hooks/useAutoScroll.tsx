import { springScrollTo } from "@follow/utils/scroller"
import { debounce, throttle } from "es-toolkit/compat"
import { useCallback, useEffect, useRef, useState } from "react"

const BOTTOM_THRESHOLD = 50

export const useAutoScroll = (viewport: HTMLElement | null, enabled: boolean) => {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null)
  const isAutoScrollingRef = useRef(false)
  const isAutoScrollCancelledRef = useRef(false)

  const isAtBottomRef = useRef(isAtBottom)
  useEffect(() => {
    isAtBottomRef.current = isAtBottom
  }, [isAtBottom])

  // cancellation is tracked purely via ref to avoid re-renders while user interacts

  const scrollToBottom = useCallback(
    (force = false) => {
      if (!viewport) return

      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }

      if (force || (isAtBottomRef.current && !isAutoScrollCancelledRef.current)) {
        isAutoScrollingRef.current = true
        const targetScrollTop = viewport.scrollHeight - viewport.clientHeight
        const animation = springScrollTo(targetScrollTop, viewport)

        scrollAnimationRef.current = animation
        animation.then(() => {
          scrollAnimationRef.current = null
          isAutoScrollingRef.current = false
          // After animation, re-evaluate position
          const { scrollTop, scrollHeight, clientHeight } = viewport
          const atBottom = scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD
          if (isAtBottomRef.current !== atBottom) {
            setIsAtBottom(atBottom)
          }
        })
      }
    },
    [viewport],
  )

  useEffect(() => {
    if (!viewport) return
    if (!enabled) return

    const handleScroll = throttle(() => {
      if (isAutoScrollingRef.current) {
        return
      }
    }, 100)

    const cancelAutoScroll = () => {
      isAutoScrollingRef.current = false

      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }
      isAutoScrollCancelledRef.current = true
      handleScroll()
    }

    const handleWheel = throttle(cancelAutoScroll, 100)
    const handleTouchStart = handleWheel
    const handleTouchMove = handleWheel

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    viewport.addEventListener("wheel", handleWheel, { passive: true })
    viewport.addEventListener("touchstart", handleTouchStart, { passive: true })
    viewport.addEventListener("touchmove", handleTouchMove, { passive: true })

    return () => {
      viewport.removeEventListener("scroll", handleScroll)
      viewport.removeEventListener("wheel", handleWheel)
      viewport.removeEventListener("touchstart", handleTouchStart)
      viewport.removeEventListener("touchmove", handleTouchMove)
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }
    }
  }, [viewport, enabled])

  useEffect(() => {
    if (!viewport || !enabled) return

    const content = viewport.firstElementChild as HTMLElement
    if (!content) return

    const resizeObserver = new ResizeObserver(
      debounce(() => {
        if (isAtBottomRef.current && !isAutoScrollCancelledRef.current) {
          requestAnimationFrame(() => {
            scrollToBottom()
          })
        }
      }, 16),
    )

    resizeObserver.observe(content)

    return () => {
      resizeObserver.disconnect()
    }
  }, [viewport, enabled, scrollToBottom])

  const resetScrollState = useCallback(() => {
    isAutoScrollCancelledRef.current = false
    setIsAtBottom(true)
    scrollToBottom(true)
  }, [scrollToBottom])

  return { resetScrollState, scrollToBottom }
}
