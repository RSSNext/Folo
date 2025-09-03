import { Spring } from "@follow/components/constants/spring.js"
import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { AnimatePresence } from "motion/react"
import { memo, useEffect, useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"
import { useParams } from "react-router"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { getUISettings, setUISetting } from "~/atoms/settings/ui"
import { getFeedColumnShow, setTimelineColumnShow } from "~/atoms/sidebar"
import { m } from "~/components/common/Motion"
import { readableContentMaxWidthClassName, ROUTE_ENTRY_PENDING } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { AIChatLayout } from "~/modules/app-layout/ai/AIChatLayout"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { AIChatRoot } from "../ai-chat/components/layouts/AIChatRoot"
import { AISplineButton } from "../app-layout/ai/AISplineButton"
import { EntryColumn } from "./index"

const AIEntryLayoutImpl = () => {
  const { entryId } = useParams()
  const navigate = useNavigateEntry()
  const panelStyle = useAIChatPanelStyle()

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId

  // Entry content ref (for focus/measurement if needed)
  const entryContentRef = useRef<HTMLDivElement>(null)

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

  // Hide the subscription column while entry content is open and restore on close
  useEffect(() => {
    if (!realEntryId) return
    const prevShown = getFeedColumnShow()
    if (prevShown) setTimelineColumnShow(false)
    return () => {
      // Only restore when it was previously shown
      if (prevShown) setTimelineColumnShow(true)
    }
  }, [realEntryId])
  return (
    <div className="relative flex min-w-0 grow">
      <div className={cn("h-full flex-1", panelStyle === AIChatPanelStyle.Fixed && "border-r")}>
        <AppLayoutGridContainerProvider>
          <div className="relative h-full overflow-hidden">
            {/* Entry list - always rendered to prevent animation */}
            <div
              className={cn(realEntryId ? readableContentMaxWidthClassName : undefined, "h-full")}
              // Visually constrain list width when content is open
            >
              <EntryColumn key="entry-list" />
            </div>

            {/* Entry content: fixed width panel that slides in under AI chat */}
            <AnimatePresence initial={false}>
              {realEntryId && (
                <div className="pointer-events-none absolute inset-0 z-30">
                  {/* Scrim covers uncovered area; animate with content */}
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={Spring.presets.fastSmooth}
                    className="bg-background/50 pointer-events-auto absolute inset-0 backdrop-blur-[2px]"
                    onClick={() => navigate({ entryId: null })}
                  />

                  <m.div
                    lcpOptimization
                    key={realEntryId}
                    ref={entryContentRef}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={Spring.presets.fastSmooth}
                    className="bg-theme-background pointer-events-auto absolute inset-y-0 right-0 z-10 w-[clamp(50ch,65vw,75ch)] border-l"
                  >
                    <EntryContent entryId={realEntryId} className="h-full" />
                  </m.div>
                </div>
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
