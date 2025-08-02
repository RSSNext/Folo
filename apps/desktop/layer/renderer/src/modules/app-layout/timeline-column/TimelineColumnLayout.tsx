import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { views } from "@follow/constants"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn, isSafari } from "@follow/utils/utils"
import { useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"
import { Outlet } from "react-router"

import {
  getUISettings,
  setUISetting,
  useRealInWideMode,
  useUISettingKey,
} from "~/atoms/settings/ui"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { EntryColumn } from "~/modules/entry-column"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

export function TimelineColumnLayout() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Memo this initial value to avoid re-render

  const settingWideMode = useRealInWideMode()
  const entryColWidth = useMemo(() => getUISettings().entryColWidth, [])
  const { view } = useRouteParams()
  const inWideMode = (view ? views[view]!.wideMode : false) || settingWideMode
  const feedColumnWidth = useUISettingKey("feedColWidth")
  const startDragPosition = useRef(0)
  const { position, separatorProps, isDragging, separatorCursor, setPosition } = useResizable({
    axis: "x",
    // FIXME: Less than this width causes grid images to overflow on safari
    min: isSafari() ? 356 : 300,
    max: Math.max((window.innerWidth - feedColumnWidth) / 2, 600),
    initial: entryColWidth,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    onResizeStart({ position }) {
      startDragPosition.current = position
    },
    onResizeEnd({ position }) {
      if (position === startDragPosition.current) return
      setUISetting("entryColWidth", position)
      // TODO: Remove this after useMeasure can get bounds in time
      window.dispatchEvent(new Event("resize"))
    },
  })

  return (
    <div ref={containerRef} className="relative flex min-w-0 grow">
      <div
        className={cn("h-full shrink-0", inWideMode ? "flex-1" : "border-r", "will-change-[width]")}
        data-hide-in-print
        style={{
          width: position,
        }}
      >
        <AppLayoutGridContainerProvider>
          <EntryColumn />
        </AppLayoutGridContainerProvider>
      </div>
      {!inWideMode && (
        <PanelSplitter
          {...separatorProps}
          cursor={separatorCursor}
          isDragging={isDragging}
          onDoubleClick={() => {
            setUISetting("entryColWidth", defaultUISettings.entryColWidth)
            setPosition(defaultUISettings.entryColWidth)
          }}
        />
      )}
      <Outlet />
    </div>
  )
}
