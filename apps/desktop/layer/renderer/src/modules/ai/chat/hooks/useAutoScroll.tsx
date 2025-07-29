import { springScrollTo } from "@follow/utils/scroller"
import { debounce } from "es-toolkit/compat"
import { useCallback, useEffect, useRef, useState } from "react"

const BOTTOM_THRESHOLD = 50

export const useAutoScroll = (viewport: HTMLElement | null, enabled: boolean) => {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null)
  const interactionTimeoutRef = useRef<number | null>(null)
  const isAutoScrollingRef = useRef(false)

  const isUserInteractingRef = useRef(isUserInteracting)
  useEffect(() => {
    isUserInteractingRef.current = isUserInteracting
  }, [isUserInteracting])

  const isAtBottomRef = useRef(isAtBottom)
  useEffect(() => {
    isAtBottomRef.current = isAtBottom
  }, [isAtBottom])

  const scrollToBottom = useCallback(
    (force = false) => {
      if (!viewport) return

      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }

      if (force || (!isUserInteractingRef.current && isAtBottomRef.current)) {
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

    if (!enabled) {
      return
    }

    const handleScroll = () => {
      if (isAutoScrollingRef.current) {
        return
      }

      const { scrollTop, scrollHeight, clientHeight } = viewport
      const atBottom = scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD

      if (!isUserInteractingRef.current) {
        setIsAtBottom(atBottom)
      }
    }

    const handleWheel = () => {
      isAutoScrollingRef.current = false
      setIsUserInteracting(true)

      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }
      if (interactionTimeoutRef.current) {
        window.clearTimeout(interactionTimeoutRef.current)
      }

      interactionTimeoutRef.current = window.setTimeout(() => {
        setIsUserInteracting(false)
        handleScroll() // Re-check position after interaction ends
      }, 150)
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    viewport.addEventListener("wheel", handleWheel, { passive: true })

    return () => {
      viewport.removeEventListener("scroll", handleScroll)
      viewport.removeEventListener("wheel", handleWheel)
      if (interactionTimeoutRef.current) {
        window.clearTimeout(interactionTimeoutRef.current)
      }
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }
    }
  }, [viewport])

  useEffect(() => {
    if (!viewport || !enabled) return

    const content = viewport.firstElementChild as HTMLElement
    if (!content) return

    const resizeObserver = new ResizeObserver(
      debounce(() => {
        if (!isUserInteractingRef.current && isAtBottomRef.current) {
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
    setIsUserInteracting(false)
    setIsAtBottom(true)
    scrollToBottom(true)
  }, [scrollToBottom])

  return { resetScrollState, scrollToBottom }
}
