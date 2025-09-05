import { Spring } from "@follow/components/constants/spring.js"
import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { AnimatePresence } from "motion/react"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"
import { useParams } from "react-router"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { getUISettings, setUISetting } from "~/atoms/settings/ui"
import { m } from "~/components/common/Motion"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { AIChatLayout } from "~/modules/app-layout/ai/AIChatLayout"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { AIChatRoot } from "../ai-chat/components/layouts/AIChatRoot"
import { AISplineButton } from "../app-layout/ai/AISplineButton"
import { setScrollToExitTutorialSeen } from "./atoms/tutorial"
import { EntryColumn } from "./index"

const AIEntryLayoutImpl = () => {
  const { entryId } = useParams()
  const navigate = useNavigateEntry()
  const panelStyle = useAIChatPanelStyle()

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId

  // Swipe/scroll to close functionality
  const entryContentRef = useRef<HTMLDivElement>(null)
  const accumulatedDelta = useRef(0)
  const isScrollingAtTop = useRef(false)

  const { view: currentView } = useRouteParams()

  const closeEntry = useCallback(() => {
    navigate({ entryId: null, view: currentView })
  }, [navigate, currentView])

  const handleCloseGesture = useCallback(() => {
    closeEntry()
  }, [closeEntry])

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

      // Handle trackpad/mouse wheel: upward scroll (deltaY < 0) or downward swipe gesture
      // On macOS trackpad, natural scrolling makes upward finger movement negative deltaY
      if (e.deltaY < 0 && isScrollingAtTop.current) {
        e.preventDefault()
        accumulatedDelta.current += Math.abs(e.deltaY)

        // Close when accumulated scroll exceeds threshold (150px for trackpad sensitivity)
        if (accumulatedDelta.current > 1000) {
          handleCloseGesture()
          accumulatedDelta.current = 0
          setScrollToExitTutorialSeen(true)
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

    return () => {
      elementsToListen.forEach((el) => {
        el.removeEventListener("wheel", handleWheel)
      })
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
      <div className={cn("h-full flex-1", panelStyle === AIChatPanelStyle.Fixed && "border-r")}>
        <AppLayoutGridContainerProvider>
          <div className="relative h-full">
            {/* Entry list - always rendered to prevent animation */}
            <EntryColumn key="entry-list" />

            <AnimatePresence>
              {realEntryId && (
                <m.div
                  lcpOptimization
                  ref={entryContentRef}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={Spring.presets.smooth}
                  className="bg-theme-background absolute inset-0 z-10 border-l"
                >
                  <EntryContent entryId={realEntryId} className="h-full" />
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </AppLayoutGridContainerProvider>
      </div>

      {/* Fixed panel layout */}
      {panelStyle === AIChatPanelStyle.Fixed && (
        <>
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
            key="ai-chat-layout"
            style={
              { width: position, "--ai-chat-layout-width": `${position}px` } as React.CSSProperties
            }
          />
        </>
      )}

      {/* Floating panel - renders outside layout flow */}
      {panelStyle === AIChatPanelStyle.Floating && <AIChatLayout key="ai-chat-layout" />}
    </div>
  )
}

export const AIEntryLayout = memo(function AIEntryLayout() {
  return (
    <AIChatRoot wrapFocusable={false}>
      <AIEntryLayoutImpl />
      <AISplineButton />
    </AIChatRoot>
  )
})
AIEntryLayout.displayName = "AIEntryLayout"
