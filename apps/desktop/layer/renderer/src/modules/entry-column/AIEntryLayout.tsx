import { Spring } from "@follow/components/constants/spring.js"
import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import { useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"
import { useParams } from "react-router"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { getUISettings, setUISetting } from "~/atoms/settings/ui"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { AIChatLayout } from "~/modules/app-layout/ai/AIChatLayout"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { AIChatRoot } from "../ai-chat/components/layouts/AIChatRoot"
import { EntryColumn } from "./index"

const AIEntryLayoutImpl = () => {
  const { entryId } = useParams()

  const panelStyle = useAIChatPanelStyle()

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId

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

            {/* Entry content overlay with exit animation */}
            <AnimatePresence mode="popLayout">
              {realEntryId && (
                <m.div
                  initial={{ y: 150, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 150, opacity: 0, scale: 0.98 }}
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
            style={
              { width: position, "--ai-chat-layout-width": `${position}px` } as React.CSSProperties
            }
          />
        </>
      )}

      {/* Floating panel - renders outside layout flow */}
      {panelStyle === AIChatPanelStyle.Floating && <AIChatLayout />}
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
