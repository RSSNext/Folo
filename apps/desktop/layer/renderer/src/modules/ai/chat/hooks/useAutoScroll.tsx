import { springScrollTo } from "@follow/utils/scroller"
import * as React from "react"

const SCROLL_THRESHOLD = 80

// Custom hook for auto-scroll with interruption logic
export const useAutoScroll = (viewport: HTMLElement | null, enabled: boolean) => {
  const scrollAnimationRef = React.useRef<{ stop: () => void } | null>(null)
  const userScrolledUpRef = React.useRef(false)
  const lastScrollTopRef = React.useRef(0)
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null)

  // Add programmatic scroll flag to avoid misjudgment of user scroll.
  const isProgrammaticScrollRef = React.useRef(false)
  // Record the callback of the scroll animation completion.
  const scrollAnimationCompleteRef = React.useRef<number | null>(null)

  const isNearBottom = React.useCallback((element: HTMLElement) => {
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 10
  }, [])

  const scrollToBottom = React.useCallback(() => {
    if (!viewport || userScrolledUpRef.current) return

    const targetScrollTop = viewport.scrollHeight - viewport.clientHeight
    if (targetScrollTop <= 0) return

    // Mark as programmatic scroll.
    isProgrammaticScrollRef.current = true

    // Clear the previous animation completion timer.
    if (scrollAnimationCompleteRef.current) {
      window.clearTimeout(scrollAnimationCompleteRef.current)
    }

    // Stop any existing animation
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop()
    }

    // Use springScrollTo for smooth scrolling
    const animation = springScrollTo(targetScrollTop, viewport)
    scrollAnimationRef.current = {
      stop: () => animation.stop(),
    }

    // Reset the programmatic scroll flag after the animation completes.
    animation
      .then(() => {
        scrollAnimationCompleteRef.current = window.setTimeout(() => {
          isProgrammaticScrollRef.current = false
        }, 100) // Give a small delay to ensure all related scroll events are correctly marked.
      })
      .catch(() => {
        // Reset the flag when the animation is interrupted.
        isProgrammaticScrollRef.current = false
      })

    lastScrollTopRef.current = targetScrollTop
  }, [viewport])

  // Monitor user scrolling behavior
  React.useEffect(() => {
    if (!viewport) return

    const handleScroll = () => {
      const currentScrollTop = viewport.scrollTop

      // If it's a programmatic scroll, do not perform user scroll detection.
      if (isProgrammaticScrollRef.current) {
        lastScrollTopRef.current = currentScrollTop
        return
      }

      const scrollDelta = lastScrollTopRef.current - currentScrollTop

      // If the user has scrolled up more than the threshold, disable auto-scroll.
      if (scrollDelta > SCROLL_THRESHOLD) {
        userScrolledUpRef.current = true
      } else if (isNearBottom(viewport)) {
        // If user is near bottom, re-enable auto-scroll
        userScrolledUpRef.current = false
      }

      lastScrollTopRef.current = currentScrollTop
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [viewport, isNearBottom])

  // Monitor content height changes for auto-scroll
  React.useEffect(() => {
    if (!viewport || !enabled) return

    const content = viewport.firstElementChild as HTMLElement
    if (!content) return

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
    }

    let previousScrollHeight = viewport.scrollHeight
    let previousScrollTop = viewport.scrollTop

    const resizeObserver = new ResizeObserver(() => {
      // Only auto-scroll if user hasn't manually scrolled up
      if (!userScrolledUpRef.current) {
        const currentScrollHeight = viewport.scrollHeight
        const currentScrollTop = viewport.scrollTop

        // Only scroll to bottom if the content height increased AND
        // the scroll position is still at the bottom (user didn't scroll)
        const heightIncreased = currentScrollHeight > previousScrollHeight
        const wasAtBottom = previousScrollTop + viewport.clientHeight >= previousScrollHeight - 10
        const stillAtBottom = currentScrollTop + viewport.clientHeight >= previousScrollHeight - 10

        if (heightIncreased && (wasAtBottom || stillAtBottom)) {
          // Use a small delay to ensure content is fully rendered
          requestAnimationFrame(() => {
            scrollToBottom()
          })
        }

        previousScrollHeight = currentScrollHeight
        previousScrollTop = currentScrollTop
      }
    })

    resizeObserver.observe(content)
    resizeObserverRef.current = resizeObserver

    return () => {
      resizeObserver.disconnect()
      resizeObserverRef.current = null
    }
  }, [viewport, enabled, scrollToBottom])

  // Reset user scroll state when new messages start
  const resetScrollState = React.useCallback(() => {
    userScrolledUpRef.current = false
    isProgrammaticScrollRef.current = false
    if (viewport) {
      lastScrollTopRef.current = viewport.scrollTop
    }
  }, [viewport])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (scrollAnimationCompleteRef.current) {
        window.clearTimeout(scrollAnimationCompleteRef.current)
      }
    }
  }, [])

  return { resetScrollState, scrollToBottom }
}
