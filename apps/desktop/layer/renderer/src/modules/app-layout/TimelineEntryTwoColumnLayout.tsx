import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { getView } from "@follow/constants"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn, isSafari } from "@follow/utils/utils"
import { useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"
import { Outlet } from "react-router"

import { getUISettings, setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { EntryColumn } from "~/modules/entry-column"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

/**
 * TimelineEntryTwoColumnLayout Component
 *
 * A resizable two-column layout for timeline entry browsing and content reading.
 * This layout manages:
 * - Entry column (left): Displays the list of timeline entries/articles
 * - Content area (right): Renders the selected entry content via Outlet
 * - Resizable splitter: Allows users to adjust column widths
 * - Wide mode support: Adapts layout for wide content types
 *
 * Layout Behavior:
 * - Normal mode: Entry column + resizable splitter + content area
 * - Wide mode: Entry column takes full width, no splitter
 * - Persists column width settings in user preferences
 * - Responsive sizing with min/max constraints
 *
 * @component
 * @example
 * // Used in timeline routes like /timeline/:timelineId/:feedId
 * // Renders EntryColumn on left, Outlet content on right
 */
export function TimelineEntryTwoColumnLayout() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Memo this initial value to avoid re-render

  const entryColWidth = useMemo(() => getUISettings().entryColWidth, [])
  const { view } = useRouteParams()
  const inWideMode = (view ? getView(view)?.wideMode : false) || false
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
