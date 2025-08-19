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
import { useEventCallback } from "usehooks-ts"

import { FocusablePresets } from "~/components/common/Focusable"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"

export const EntryScrollingAndNavigationHandler = ({
  scrollerRef,
  scrollAnimationRef,
}: {
  scrollerRef: React.RefObject<HTMLDivElement | null>
  scrollAnimationRef: React.RefObject<JSAnimation<any> | null>
}) => {
  const isAlreadyScrolledBottomRef = useRef(false)
  const [showKeepScrollingPanel, setShowKeepScrollingPanel] = useState(false)

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

  const { highlightBoundary } = useFocusActions()
  const smoothScrollTo = useSmoothScroll()
  const navigateToNext = useEventCallback(() => {
    EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
    setShowKeepScrollingPanel(false)
    isAlreadyScrolledBottomRef.current = false
    if (scrollerRef.current) {
      smoothScrollTo(0, scrollerRef.current)
    }
  })
  useEffect(() => {
    const checkScrollBottom = ($scroller: HTMLDivElement) => {
      const currentScroll = $scroller.scrollTop
      const { scrollHeight, clientHeight } = $scroller

      if (isAlreadyScrolledBottomRef.current) {
        navigateToNext()
        return
      }

      if (scrollHeight && clientHeight) {
        isAlreadyScrolledBottomRef.current =
          Math.abs(currentScroll + clientHeight - scrollHeight) < 2
        setShowKeepScrollingPanel(isAlreadyScrolledBottomRef.current)
      }
    }

    const checkScrollBottomByWheel = () => {
      isAlreadyScrolledBottomRef.current = false
      setShowKeepScrollingPanel(false)
    }
    scrollerRef.current?.addEventListener("wheel", checkScrollBottomByWheel)

    const cleanupScrollAnimation = () => {
      scrollAnimationRef.current?.stop()
      scrollAnimationRef.current = null
    }
    return combineCleanupFunctions(
      () => {
        scrollerRef.current?.removeEventListener("wheel", checkScrollBottomByWheel)
      },
      cleanupScrollAnimation,
      EventBus.subscribe(COMMAND_ID.entryRender.scrollUp, () => {
        const $scroller = scrollerRef.current
        if (!$scroller) return

        const currentScroll = $scroller.scrollTop
        // Smart scroll distance: larger viewports get larger scroll distances
        // But cap it at a reasonable maximum for very large screens
        const viewportHeight = $scroller.clientHeight
        const delta = Math.min(Math.max(120, viewportHeight * 0.25), 250)

        cleanupScrollAnimation()
        const targetScroll = Math.max(0, currentScroll - delta)
        smoothScrollTo(targetScroll, $scroller)
        checkScrollBottom($scroller)
      }),

      EventBus.subscribe(COMMAND_ID.entryRender.scrollDown, () => {
        const $scroller = scrollerRef.current
        if (!$scroller) return

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
        checkScrollBottom($scroller)
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
  }, [highlightBoundary, navigateToNext, scrollAnimationRef, scrollerRef, smoothScrollTo])

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
            "border-border/40 bg-material-ultra-thick shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]",
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
    </AnimatePresence>
  )
}
