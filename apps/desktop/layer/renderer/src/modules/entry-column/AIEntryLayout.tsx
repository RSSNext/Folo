import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useResizable } from "react-resizable-layout"
import { useParams } from "react-router"

import { getUISettings, setUISetting } from "~/atoms/settings/ui"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { AIChatLayout } from "~/modules/app-layout/ai/AIChatLayout"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { AIChatRoot } from "../ai-chat/components/layouts/AIChatRoot"
import { EntryColumn } from "./index"

const AIEntryLayoutImpl = () => {
  const { entryId } = useParams()
  const navigate = useNavigateEntry()

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId

  // Swipe/scroll to close functionality
  const entryContentRef = useRef<HTMLDivElement>(null)
  const accumulatedDelta = useRef(0)
  const isScrollingAtTop = useRef(false)
  const [showScrollHint, setShowScrollHint] = useState(false)

  const handleCloseGesture = useCallback(() => {
    navigate({ entryId: null })
  }, [navigate])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!realEntryId || !entryContentRef.current) return

      // Find the actual scroll viewport element with correct Radix UI attribute
      const entryContentElement = entryContentRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement
      const scrollElement = entryContentElement || entryContentRef.current

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
    },
    [realEntryId, handleCloseGesture],
  )

  useEffect(() => {
    if (!realEntryId || !entryContentRef.current) return

    const element = entryContentRef.current

    // Find the scroll area viewport element with correct Radix UI attribute
    const scrollViewport = element.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement

    // Add wheel event listener to both the main container and scroll viewport
    // This ensures the gesture works in both header area and scrollable content
    const elementsToListen: HTMLElement[] = [element]
    if (scrollViewport) {
      elementsToListen.push(scrollViewport)
    }

    elementsToListen.forEach((el) => {
      el.addEventListener("wheel", handleWheel, { passive: false })
    })

    // Initial scroll position check for hint visibility
    const initialCheckScrollPosition = () => {
      const scrollTop = scrollViewport?.scrollTop || element.scrollTop || 0
      setShowScrollHint(scrollTop === 0)
    }

    // Check initial position
    initialCheckScrollPosition()

    // Add scroll listener for hint visibility
    const scrollElement = scrollViewport || element
    scrollElement.addEventListener("scroll", initialCheckScrollPosition, { passive: true })

    return () => {
      elementsToListen.forEach((el) => {
        el.removeEventListener("wheel", handleWheel)
      })
      scrollElement.removeEventListener("scroll", initialCheckScrollPosition)
    }
  }, [realEntryId, handleWheel])

  // AI chat resizable panel configuration
  const aiColWidth = useMemo(() => getUISettings().aiColWidth, [])
  const startDragPosition = useRef(0)
  const { position, separatorProps, isDragging, separatorCursor, setPosition } = useResizable({
    axis: "x",
    min: 300,
    max: 1200,
    initial: aiColWidth,
    reverse: true,
    onResizeStart({ position }) {
      startDragPosition.current = position
    },
    onResizeEnd({ position }) {
      if (position === startDragPosition.current) return
      setUISetting("aiColWidth", position)
      // TODO: Remove this after useMeasure can get bounds in time
      window.dispatchEvent(new Event("resize"))
    },
  })

  return (
    <div className="relative flex min-w-0 grow">
      <div className="h-full flex-1 border-r">
        <AppLayoutGridContainerProvider>
          <div className="relative h-full">
            {/* Entry list - always rendered to prevent animation */}
            <EntryColumn key="entry-list" />

            {/* Entry content overlay with exit animation */}
            <AnimatePresence mode="wait">
              {realEntryId && (
                <m.div
                  ref={entryContentRef}
                  key={realEntryId}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={Spring.presets.smooth}
                  className="bg-theme-background absolute inset-0 z-10 border-l"
                >
                  {/* Scroll hint indicator */}
                  <div className="center z-50 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate({ entryId: null })}
                      buttonClassName="transform cursor-pointer select-none"
                      aria-label="Scroll up or click to exit"
                    >
                      <div className="text-text flex items-center gap-2 rounded-full font-medium">
                        <i
                          className={cn(
                            "text-base",
                            showScrollHint ? "i-mgc-up-cute-re" : "i-mgc-close-cute-re",
                          )}
                        />
                        <span>{showScrollHint ? "Scroll up to exit" : "Click to exit"}</span>
                      </div>
                    </Button>
                  </div>
                  <EntryContent entryId={realEntryId} className="h-[calc(100%-2.25rem)]" />
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </AppLayoutGridContainerProvider>
      </div>
      <PanelSplitter
        {...separatorProps}
        cursor={separatorCursor}
        isDragging={isDragging}
        onDoubleClick={() => {
          setUISetting("aiColWidth", defaultUISettings.aiColWidth)
          setPosition(defaultUISettings.aiColWidth)
        }}
      />
      <AIChatLayout
        style={
          { width: position, "--ai-chat-layout-width": `${position}px` } as React.CSSProperties
        }
      />
    </div>
  )
}

export const AIEntryLayout = () => {
  return (
    <AIChatRoot wrapFocusable={false}>
      <AIEntryLayoutImpl />
    </AIChatRoot>
  )
}
