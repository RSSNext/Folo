import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { throttle } from "es-toolkit"
import { useEffect, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

interface UseWheelGestureCloseOptions {
  /** Whether the gesture is enabled */
  enabled: boolean
  /** Callback to execute when close gesture is triggered */
  onClose: () => void
}

interface UseWheelGestureCloseReturn {
  /** Whether to show scroll hint indicator */
  showScrollHint: boolean
}

/**
 * Custom hook for handling wheel gesture to close entry
 * Handles trackpad/mouse wheel upward scroll when at top of content
 */
export const useWheelGestureClose = ({
  enabled,
  onClose: handleCloseGesture,
}: UseWheelGestureCloseOptions): UseWheelGestureCloseReturn => {
  const $scrollAreaElement = useScrollViewElement()
  const accumulatedDelta = useRef(0)
  const isScrollingAtTop = useRef(false)
  const [showScrollHint, setShowScrollHint] = useState(false)

  const handleWheel = useEventCallback(
    throttle((e: WheelEvent) => {
      if (!enabled) return

      // Find the actual scroll viewport element with correct Radix UI attribute

      const scrollElement = $scrollAreaElement

      // Check if we're at the top of the content
      const scrollTop = scrollElement?.scrollTop || 0

      isScrollingAtTop.current = scrollTop === 0
      setShowScrollHint(scrollTop === 0)

      // Handle trackpad/mouse wheel: upward scroll (deltaY < 0) or downward swipe gesture
      // On macOS trackpad, natural scrolling makes upward finger movement negative deltaY
      if (e.deltaY < 0 && isScrollingAtTop.current) {
        e.preventDefault()
        accumulatedDelta.current += Math.abs(e.deltaY)

        // Close when accumulated scroll exceeds threshold (150px for trackpad sensitivity)
        if (accumulatedDelta.current > 1000) {
          handleCloseGesture()
          accumulatedDelta.current = 0
        }
      } else {
        // Reset accumulation when scrolling down or not at top
        accumulatedDelta.current = 0
      }
    }, 16),
  )

  useEffect(() => {
    if (!$scrollAreaElement) return
    // Find the scroll area viewport element with correct Radix UI attribute

    // Add wheel event listener to both the main container and scroll viewport
    // This ensures the gesture works in both header area and scrollable content
    const elementsToListen: HTMLElement[] = [$scrollAreaElement]

    elementsToListen.forEach((el) => {
      el.addEventListener("wheel", handleWheel, { passive: false })
    })

    // Initial scroll position check for hint visibility
    const initialCheckScrollPosition = () => {
      if (!$scrollAreaElement) return
      const scrollTop = $scrollAreaElement.scrollTop || 0
      setShowScrollHint(scrollTop === 0)
    }

    // Check initial position
    initialCheckScrollPosition()

    // Add scroll listener for hint visibility

    $scrollAreaElement.addEventListener("scroll", initialCheckScrollPosition, { passive: true })

    return () => {
      elementsToListen.forEach((el) => {
        el.removeEventListener("wheel", handleWheel)
      })
      $scrollAreaElement.removeEventListener("scroll", initialCheckScrollPosition)
    }
  }, [$scrollAreaElement, handleWheel])

  return {
    showScrollHint,
  }
}
