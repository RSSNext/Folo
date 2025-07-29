import {
  useFocusActions,
  useGlobalFocusableScopeSelector,
} from "@follow/components/common/Focusable/index.js"
import { useSmoothScroll } from "@follow/hooks"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { cn, combineCleanupFunctions } from "@follow/utils/utils"
import type { JSAnimation } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { useEffect, useRef, useState } from "react"

import { FocusablePresets } from "~/components/common/Focusable"
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

  useCommandHotkey({
    commandId: COMMAND_ID.layout.focusToTimeline,
    when,
    shortcut: "Backspace, Escape",
  })

  const { highlightBoundary } = useFocusActions()
  const smoothScrollTo = useSmoothScroll()
  useEffect(() => {
    const checkScrollBottom = ($scroller: HTMLDivElement) => {
      const currentScroll = $scroller.scrollTop
      const { scrollHeight, clientHeight } = $scroller

      if (isAlreadyScrolledBottomRef.current) {
        EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
        setShowKeepScrollingPanel(false)
        isAlreadyScrolledBottomRef.current = false
        smoothScrollTo(0, $scroller)
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
  }, [highlightBoundary, scrollAnimationRef, scrollerRef, smoothScrollTo])

  return (
    <AnimatePresence>
      {showKeepScrollingPanel && (
        <FloatPanel side="bottom">
          Already scrolled to the bottom.
          <br />
          Keep pressing to jump to the next article
        </FloatPanel>
      )}
    </AnimatePresence>
  )
}

const FloatPanel: React.FC<{ children: React.ReactNode; side: "bottom" | "top" }> = ({
  children,
  side,
}) => (
  <m.div
    initial={{ opacity: 0, y: 32 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 32 }}
    transition={{ duration: 0.2 }}
    className={cn(
      "bg-material-ultra-thick text-text backdrop-blur-background absolute left-1/2 z-50 -translate-x-1/2 select-none rounded-2xl px-6 py-3 text-center text-[15px] font-medium shadow-xl",
      side === "bottom" ? "bottom-8" : "top-8",
    )}
    style={{
      boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.08)",
      WebkitBackdropFilter: "blur(16px)",
      backdropFilter: "blur(16px)",
      maxWidth: 360,
      width: "calc(100vw - 32px)",
    }}
  >
    {children}
  </m.div>
)
