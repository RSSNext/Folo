import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { throttle } from "es-toolkit"
import { startTransition, useEffect, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { NAVIGATION_HINTS_CONSTANTS } from "../constants/navigation-hints"

interface UseEntryNavigationHintsOptions {
  /** Whether hints are enabled */
  enabled: boolean
  /** Entry ID to track changes */
  entryId?: string
  /** Scroll threshold to show hint */
  scrollThreshold?: number
}

interface UseEntryNavigationHintsReturn {
  /** Show hint for first entry */
  showFirstEntryHint: boolean
  /** Show hint when scrolled past threshold */
  showScrollHint: boolean
  /** Show hint when at bottom */
  showBottomHint: boolean
}

/**
 * Custom hook for managing entry navigation hints
 * Shows contextual hints based on scroll position and entry state
 */
export const useEntryNavigationHints = ({
  enabled,
  entryId,
  scrollThreshold = NAVIGATION_HINTS_CONSTANTS.DEFAULT_SCROLL_THRESHOLD,
}: UseEntryNavigationHintsOptions): UseEntryNavigationHintsReturn => {
  const $scrollElement = useScrollViewElement()

  // State for different hint types
  const [showFirstEntryHint, setShowFirstEntryHint] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const [showBottomHint, setShowBottomHint] = useState(false)

  // Refs to track state
  const hasShownFirstHintRef = useRef(false)
  const hasShownScrollHintRef = useRef(false)
  const hasShownBottomHintRef = useRef(false)
  const currentEntryIdRef = useRef<string>(void 0)
  const firstHintTimerRef = useRef<ReturnType<typeof setTimeout>>(void 0)
  const scrollHintTimerRef = useRef<ReturnType<typeof setTimeout>>(void 0)
  const bottomHintTimerRef = useRef<ReturnType<typeof setTimeout>>(void 0)
  const lastScrollTopRef = useRef(0)
  const scrollDirectionRef = useRef<"up" | "down" | "none">("none")

  // Reset hints when entry changes
  useEffect(() => {
    if (entryId && entryId !== currentEntryIdRef.current) {
      currentEntryIdRef.current = entryId
      hasShownFirstHintRef.current = false
      hasShownScrollHintRef.current = false
      hasShownBottomHintRef.current = false
      lastScrollTopRef.current = 0
      scrollDirectionRef.current = "none"

      // Clear existing timers
      if (firstHintTimerRef.current) clearTimeout(firstHintTimerRef.current)
      if (scrollHintTimerRef.current) clearTimeout(scrollHintTimerRef.current)
      if (bottomHintTimerRef.current) clearTimeout(bottomHintTimerRef.current)

      // Reset all hint states with low priority
      startTransition(() => {
        setShowFirstEntryHint(false)
        setShowScrollHint(false)
        setShowBottomHint(false)
      })

      if (enabled) {
        // Show first entry hint after a brief delay
        firstHintTimerRef.current = setTimeout(() => {
          if (!hasShownFirstHintRef.current) {
            startTransition(() => {
              setShowFirstEntryHint(true)
            })
            hasShownFirstHintRef.current = true

            // Hide after configured duration
            firstHintTimerRef.current = setTimeout(() => {
              startTransition(() => {
                setShowFirstEntryHint(false)
              })
            }, NAVIGATION_HINTS_CONSTANTS.HINT_DISPLAY_DURATION)
          }
        }, NAVIGATION_HINTS_CONSTANTS.FIRST_HINT_DELAY) // Small delay to allow content to load
      }
    }
  }, [entryId, enabled])

  // Scroll handler to manage hints based on scroll position
  const handleScroll = useEventCallback(
    throttle(() => {
      if (!enabled || !$scrollElement) return

      const { scrollTop } = $scrollElement
      const { scrollHeight } = $scrollElement
      const { clientHeight } = $scrollElement
      const scrollBottom = scrollHeight - clientHeight - scrollTop

      // Detect scroll direction
      const lastScrollTop = lastScrollTopRef.current
      if (scrollTop > lastScrollTop) {
        scrollDirectionRef.current = "down"
      } else if (scrollTop < lastScrollTop) {
        scrollDirectionRef.current = "up"
      }
      lastScrollTopRef.current = scrollTop

      // Check if scrolled past threshold and scrolling up
      if (
        scrollTop > scrollThreshold &&
        !hasShownScrollHintRef.current &&
        scrollDirectionRef.current === "up"
      ) {
        hasShownScrollHintRef.current = true
        startTransition(() => {
          setShowScrollHint(true)
        })

        // Clear previous timer
        if (scrollHintTimerRef.current) clearTimeout(scrollHintTimerRef.current)

        // Hide after configured duration
        scrollHintTimerRef.current = setTimeout(() => {
          startTransition(() => {
            setShowScrollHint(false)
          })
        }, NAVIGATION_HINTS_CONSTANTS.HINT_DISPLAY_DURATION)
      }

      // Check if at bottom (within configured threshold)
      if (
        scrollBottom <= NAVIGATION_HINTS_CONSTANTS.BOTTOM_THRESHOLD &&
        !hasShownBottomHintRef.current
      ) {
        hasShownBottomHintRef.current = true
        startTransition(() => {
          setShowBottomHint(true)
        })

        // Clear previous timer
        if (bottomHintTimerRef.current) clearTimeout(bottomHintTimerRef.current)

        // Hide after configured duration
        bottomHintTimerRef.current = setTimeout(() => {
          startTransition(() => {
            setShowBottomHint(false)
          })
          hasShownBottomHintRef.current = false
        }, NAVIGATION_HINTS_CONSTANTS.HINT_DISPLAY_DURATION)
      }

      // Hide bottom hint if user scrolls up from bottom
      if (
        scrollBottom > NAVIGATION_HINTS_CONSTANTS.BOTTOM_HIDE_THRESHOLD &&
        hasShownBottomHintRef.current &&
        scrollDirectionRef.current === "up"
      ) {
        // Clear timer if exists
        if (bottomHintTimerRef.current) clearTimeout(bottomHintTimerRef.current)

        startTransition(() => {
          setShowBottomHint(false)
        })
        hasShownBottomHintRef.current = false
      }
    }, NAVIGATION_HINTS_CONSTANTS.SCROLL_THROTTLE_INTERVAL),
  )

  // Attach scroll listener
  useEffect(() => {
    if (!enabled || !$scrollElement) return

    $scrollElement.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      $scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [enabled, $scrollElement, handleScroll])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (firstHintTimerRef.current) clearTimeout(firstHintTimerRef.current)
      if (scrollHintTimerRef.current) clearTimeout(scrollHintTimerRef.current)
      if (bottomHintTimerRef.current) clearTimeout(bottomHintTimerRef.current)
    }
  }, [])

  return {
    showFirstEntryHint,
    showScrollHint,
    showBottomHint,
  }
}
