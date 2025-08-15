import {
  useFocusActions,
  useGlobalFocusableScopeSelector,
} from "@follow/components/common/Focusable/index.js"
import { Spring } from "@follow/components/constants/spring.js"
import { useSmoothScroll } from "@follow/hooks"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { clsx, combineCleanupFunctions } from "@follow/utils/utils"
import type { JSAnimation } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useEventCallback } from "usehooks-ts"

import { useIsZenMode } from "~/atoms/settings/ui"
import { FocusablePresets } from "~/components/common/Focusable"
import { useFeature } from "~/hooks/biz/useFeature"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"
import { useCommandHotkey } from "~/modules/command/hooks/use-register-hotkey"

export const EntryScrollingAndNavigationHandler = ({
  scrollerRef,
  scrollAnimationRef,
}: {
  scrollerRef: React.RefObject<HTMLDivElement | null>
  scrollAnimationRef: React.RefObject<JSAnimation<any> | null>
}) => {
  const isAlreadyScrolledBottomRef = useRef(false)
  const isAlreadyScrolledTopRef = useRef(false)
  const lastTouchYRef = useRef<number | null>(null)
  const wheelEndTimerRef = useRef<number | null>(null)
  const wheelGestureCompleteRef = useRef(false)
  const [showKeepScrollingPanel, setShowKeepScrollingPanel] = useState(false)
  const [showBackToTimelinePanel, setShowBackToTimelinePanel] = useState(false)

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isEntryRender)

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.scrollUp,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.scrollDown,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.nextEntry,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.previousEntry,
    when,
  })

  const isZenMode = useIsZenMode()
  // TODO: Here, do not rely on the AI switch, but should be deps on the new layout.
  const isAiEnabled = useFeature("ai")

  const useBackHandler = isZenMode || isAiEnabled

  useCommandHotkey({
    commandId: COMMAND_ID.layout.focusToTimeline,
    when: when && !useBackHandler,
    shortcut: "Backspace, Escape",
  })

  const navigateToTimeline = useNavigateEntry()
  useHotkeys(
    "Escape",
    () => {
      navigateToTimeline({ entryId: null })
    },
    { enabled: when && useBackHandler },
  )

  const navigateBackToTimeline = useEventCallback(() => {
    navigateToTimeline({ entryId: null })
    setShowBackToTimelinePanel(false)
    isAlreadyScrolledTopRef.current = false
    wheelGestureCompleteRef.current = false
    if (wheelEndTimerRef.current) {
      clearTimeout(wheelEndTimerRef.current)
      wheelEndTimerRef.current = null
    }
  })

  const { highlightBoundary } = useFocusActions()
  const smoothScrollTo = useSmoothScroll()
  const navigateToNext = useEventCallback(() => {
    EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
    setShowKeepScrollingPanel(false)
    setShowBackToTimelinePanel(false)
    isAlreadyScrolledBottomRef.current = false
    isAlreadyScrolledTopRef.current = false
    wheelGestureCompleteRef.current = false
    if (wheelEndTimerRef.current) {
      clearTimeout(wheelEndTimerRef.current)
      wheelEndTimerRef.current = null
    }
    if (scrollerRef.current) {
      smoothScrollTo(0, scrollerRef.current)
    }
  })
  useEffect(() => {
    // Only check bottom scroll for keyboard navigation
    const checkBottomScrollOnly = ($scroller: HTMLDivElement) => {
      const currentScroll = $scroller.scrollTop
      const { scrollHeight, clientHeight } = $scroller

      // Check if already scrolled to bottom and user continues scrolling down
      if (isAlreadyScrolledBottomRef.current) {
        navigateToNext()
        return
      }

      if (scrollHeight && clientHeight) {
        // Check bottom scroll
        const isAtBottom = Math.abs(currentScroll + clientHeight - scrollHeight) < 2
        isAlreadyScrolledBottomRef.current = isAtBottom
        setShowKeepScrollingPanel(isAtBottom)
      }
    }

    const handleWheelEvent = (event: WheelEvent) => {
      const $scroller = scrollerRef.current
      if (!$scroller) return

      // Clear existing timer
      if (wheelEndTimerRef.current) {
        clearTimeout(wheelEndTimerRef.current)
      }

      // If scrolled to top and user tries to scroll up more
      if ($scroller.scrollTop <= 2 && event.deltaY < 0) {
        if (
          isAlreadyScrolledTopRef.current &&
          showBackToTimelinePanel &&
          wheelGestureCompleteRef.current
        ) {
          // User completed a previous wheel gesture and is starting a new one
          navigateBackToTimeline()
          return
        }

        // First time reaching top in this wheel gesture, just show the panel
        if (!isAlreadyScrolledTopRef.current) {
          isAlreadyScrolledTopRef.current = true
          setShowBackToTimelinePanel(true)
          wheelGestureCompleteRef.current = false
        }
      } else if ($scroller.scrollTop > 2) {
        // Reset states when user scrolls away from top
        isAlreadyScrolledTopRef.current = false
        setShowBackToTimelinePanel(false)
        wheelGestureCompleteRef.current = false
      }

      // Set timer to detect end of wheel gesture
      wheelEndTimerRef.current = setTimeout(() => {
        wheelGestureCompleteRef.current = true
      }, 150) // 150ms after last wheel event

      // Reset bottom state when wheel is used
      if (event.deltaY !== 0) {
        isAlreadyScrolledBottomRef.current = false
        setShowKeepScrollingPanel(false)
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      // Reset all scroll states when touch starts
      isAlreadyScrolledBottomRef.current = false
      isAlreadyScrolledTopRef.current = false
      wheelGestureCompleteRef.current = false
      setShowKeepScrollingPanel(false)
      setShowBackToTimelinePanel(false)
      // Clear wheel timer
      if (wheelEndTimerRef.current) {
        clearTimeout(wheelEndTimerRef.current)
        wheelEndTimerRef.current = null
      }
      // Store initial touch position
      if (event.touches[0]) {
        lastTouchYRef.current = event.touches[0].clientY
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      const $scroller = scrollerRef.current
      if (!$scroller || !event.touches[0]) return

      const { scrollTop } = $scroller
      // Check if at top and trying to scroll up via touch
      if (scrollTop <= 2) {
        const { clientY } = event.touches[0]
        if (
          isAlreadyScrolledTopRef.current &&
          showBackToTimelinePanel &&
          lastTouchYRef.current !== null
        ) {
          // Additional upward touch gesture at top when panel is already showing
          const deltaY = clientY - lastTouchYRef.current
          if (deltaY > 20) {
            // Threshold for upward swipe
            navigateBackToTimeline()
            return
          }
        }
        isAlreadyScrolledTopRef.current = true
        setShowBackToTimelinePanel(true)
        lastTouchYRef.current = clientY
      } else {
        isAlreadyScrolledTopRef.current = false
        setShowBackToTimelinePanel(false)
      }
    }

    scrollerRef.current?.addEventListener("wheel", handleWheelEvent)
    scrollerRef.current?.addEventListener("touchstart", handleTouchStart)
    scrollerRef.current?.addEventListener("touchmove", handleTouchMove)

    const cleanupScrollAnimation = () => {
      scrollAnimationRef.current?.stop()
      scrollAnimationRef.current = null
    }

    const cleanupTimers = () => {
      if (wheelEndTimerRef.current) {
        clearTimeout(wheelEndTimerRef.current)
        wheelEndTimerRef.current = null
      }
    }
    return combineCleanupFunctions(
      () => {
        scrollerRef.current?.removeEventListener("wheel", handleWheelEvent)
        scrollerRef.current?.removeEventListener("touchstart", handleTouchStart)
        scrollerRef.current?.removeEventListener("touchmove", handleTouchMove)
      },
      cleanupScrollAnimation,
      cleanupTimers,
      EventBus.subscribe(COMMAND_ID.entryRender.scrollUp, () => {
        const $scroller = scrollerRef.current
        if (!$scroller) return

        // Reset top scroll states for keyboard navigation
        isAlreadyScrolledTopRef.current = false
        setShowBackToTimelinePanel(false)
        wheelGestureCompleteRef.current = false

        const currentScroll = $scroller.scrollTop
        // Smart scroll distance: larger viewports get larger scroll distances
        // But cap it at a reasonable maximum for very large screens
        const viewportHeight = $scroller.clientHeight
        const delta = Math.min(Math.max(120, viewportHeight * 0.25), 250)

        cleanupScrollAnimation()
        const targetScroll = Math.max(0, currentScroll - delta)
        smoothScrollTo(targetScroll, $scroller)
        checkBottomScrollOnly($scroller)
      }),

      EventBus.subscribe(COMMAND_ID.entryRender.scrollDown, () => {
        const $scroller = scrollerRef.current
        if (!$scroller) return

        // Reset top scroll states for keyboard navigation
        isAlreadyScrolledTopRef.current = false
        setShowBackToTimelinePanel(false)
        wheelGestureCompleteRef.current = false

        const currentScroll = $scroller.scrollTop
        // Smart scroll distance: larger viewports get larger scroll distances
        // But cap it at a reasonable maximum for very large screens
        const viewportHeight = $scroller.clientHeight
        const delta = Math.min(Math.max(120, viewportHeight * 0.25), 250)

        cleanupScrollAnimation()
        const targetScroll = Math.min(
          $scroller.scrollHeight - $scroller.clientHeight,
          currentScroll + delta,
        )
        smoothScrollTo(targetScroll, $scroller)
        checkBottomScrollOnly($scroller)
      }),
      EventBus.subscribe(
        COMMAND_ID.layout.focusToEntryRender,
        ({ highlightBoundary: highlight }) => {
          const $scroller = scrollerRef.current
          if (!$scroller) {
            return
          }

          $scroller.focus()
          if (highlight) {
            nextFrame(highlightBoundary)
          }
        },
      ),
    )
  }, [
    highlightBoundary,
    navigateToNext,
    navigateBackToTimeline,
    scrollAnimationRef,
    scrollerRef,
    smoothScrollTo,
    showBackToTimelinePanel,
  ])

  return (
    <AnimatePresence>
      {showKeepScrollingPanel && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={Spring.presets.smooth}
          className={clsx(
            "pointer-events-none absolute !right-1/2 z-40 !translate-x-1/2",
            "bottom-12",
            "backdrop-blur-background rounded-full border px-3.5 py-2",
            "border-border/40 bg-material-ultra-thin/70 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]",
            "hover:bg-material-thin/70 hover:border-border/60 active:scale-[0.98]",
          )}
        >
          <button
            onClick={navigateToNext}
            type="button"
            className={"group pointer-events-auto flex items-center gap-2"}
          >
            <i className="i-mingcute-arrow-down-fill text-text/90 mr-1 size-5" />
            <span className="text-text/90 text-left text-[13px] font-medium">
              Already scrolled to the bottom.
              <br />
              Keep pressing to jump to the next article
            </span>
          </button>
        </m.div>
      )}
      {showBackToTimelinePanel && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={Spring.presets.smooth}
          className={clsx(
            "pointer-events-none absolute !right-1/2 z-40 !translate-x-1/2",
            "top-12",
            "backdrop-blur-background rounded-full border px-3.5 py-2",
            "border-border/40 bg-material-ultra-thin/70 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]",
            "hover:bg-material-thin/70 hover:border-border/60 active:scale-[0.98]",
          )}
        >
          <button
            onClick={navigateBackToTimeline}
            type="button"
            className={"group pointer-events-auto flex items-center gap-2"}
          >
            <i className="i-mingcute-arrow-up-fill text-text/90 mr-1 size-5" />
            <span className="text-text/90 text-left text-[13px] font-medium">
              Reached the top.
              <br />
              Scroll up once more to go back to timeline
            </span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  )
}
