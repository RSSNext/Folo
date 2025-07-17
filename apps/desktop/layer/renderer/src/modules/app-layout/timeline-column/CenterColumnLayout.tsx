import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"

import { getUISettings, setUISetting } from "~/atoms/settings/ui"
import { EntryColumn } from "~/modules/entry-column"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { AIChatLayout } from "../ai/AIChatLayout"

export function CenterColumnLayout() {
  // Memo this initial value to avoid re-render

  const aiColWidth = useMemo(() => getUISettings().aiColWidth, [])
  const startDragPosition = useRef(0)
  const { position, separatorProps, isDragging, separatorCursor, setPosition } = useResizable({
    axis: "x",
    min: 300,
    max: 600,
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
          <EntryColumn />
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
      <AIChatLayout style={{ width: position }} />
    </div>
  )
}
