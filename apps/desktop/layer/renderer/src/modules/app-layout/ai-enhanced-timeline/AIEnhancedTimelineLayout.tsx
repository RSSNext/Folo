import { Spring } from "@follow/components/constants/spring.js"
import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { FeedViewType } from "@follow/constants"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { isSafari } from "@follow/utils/utils"
import { AnimatePresence } from "motion/react"
import type { TransitionEvent } from "react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useResizable } from "react-resizable-layout"

import { AIChatPanelStyle, useAIChatPanelStyle, useAIPanelVisibility } from "~/atoms/settings/ai"
import { getUISettings, setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { m } from "~/components/common/Motion"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useFeature } from "~/hooks/biz/useFeature"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useShowEntryDetailsColumn } from "~/hooks/biz/useShowEntryDetailsColumn"
import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"
import { AIChatLayout } from "~/modules/app-layout/ai/AIChatLayout"
import { AIIndicator } from "~/modules/app-layout/ai/AISplineButton"
import { EntryContentPlaceholder } from "~/modules/app-layout/entry-content/EntryContentPlaceholder"
import { EntryColumn } from "~/modules/entry-column"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AIEntryHeader } from "~/modules/entry-content/components/entry-header"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"
import { MainViewHotkeysProvider } from "~/providers/main-view-hotkeys-provider"

/**
 * AIEnhancedTimelineLayout Component
 *
 * An advanced timeline layout that integrates AI chat functionality with entry browsing.
 * This layout provides:
 * - Entry list display with animated content overlay
 * - Integrated AI chat panel (Fixed/Floating modes)
 * - Dynamic subscription column toggling
 * - Smooth animations for entry transitions
 * - Resizable AI panel with persistent settings
 *
 * Layout Structure:
 * ```
 * AIEnhancedTimelineLayout
 * ├── Main Content Area
 * │   ├── EntryColumn (entry list)
 * │   ├── AIEntryHeader (animated overlay)
 * │   └── EntryContent (animated overlay)
 * ├── AI Chat Panel (resizable, optional)
 * │   ├── Fixed Panel (docked to right)
 * │   └── Floating Panel (draggable overlay)
 * └── Subscription Column Toggler
 * ```
 *
 * @component
 * @example
 * // Used in AI-enabled timeline routes
 * // Provides enhanced timeline experience with AI assistance
 */
const AIEnhancedTimelineLayoutImpl = () => {
  const aiPanelStyle = useAIChatPanelStyle()
  const isAIPanelVisible = useAIPanelVisibility()
  const aiSidebarVisible = aiPanelStyle === AIChatPanelStyle.Fixed && isAIPanelVisible

  const { view, entryId } = useRouteParamsSelector((s) => ({
    view: s.view,
    entryId: s.entryId,
  }))
  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const showEntryDetailsColumn = useShowEntryDetailsColumn()

  const layoutContainerRef = useRef<HTMLDivElement>(null)
  const hasMountedRef = useRef(false)

  // Delay the details column until the timeline width animation finishes
  const [shouldRenderDetailsColumn, setShouldRenderDetailsColumn] = useState(showEntryDetailsColumn)
  const feedColumnWidth = useUISettingKey("feedColWidth")

  // Timeline column resizable configuration (used when entry details column is visible)
  const entryColumnInitialWidth = useMemo(() => getUISettings().entryColWidth, [])
  const timelineMaxWidth = useMemo(() => {
    if (typeof window === "undefined") return 600
    return Math.max((window.innerWidth - feedColumnWidth) / 2, 600)
  }, [feedColumnWidth])
  const timelineStartDragPosition = useRef(0)
  const {
    position: timelineColumnWidth,
    separatorProps: timelineSeparatorProps,
    isDragging: isTimelineDragging,
    separatorCursor: timelineSeparatorCursor,
    setPosition: setTimelineColumnWidth,
  } = useResizable({
    axis: "x",
    min: isSafari() ? 356 : 300,
    max: timelineMaxWidth,
    initial: entryColumnInitialWidth,
    containerRef: layoutContainerRef as React.RefObject<HTMLElement>,
    onResizeStart({ position }) {
      timelineStartDragPosition.current = position
    },
    onResizeEnd({ position }) {
      if (position === timelineStartDragPosition.current) return
      setUISetting("entryColWidth", position)
      // TODO: Remove this after useMeasure can get bounds in time
      window.dispatchEvent(new Event("resize"))
    },
  })

  // AI chat resizable panel configuration
  const isAllView = view === FeedViewType.All
  const widthRange: [number, number] = isAllView ? [500, timelineMaxWidth] : [300, timelineMaxWidth]
  const [minWidth, maxWidth] = widthRange

  const clampWidth = useCallback(
    (value: number) => Math.max(minWidth, Math.min(maxWidth, Math.round(value))),
    [minWidth, maxWidth],
  )

  const getHalfScreenWidth = useCallback(
    () => clampWidth(typeof window !== "undefined" ? window.innerWidth * 0.5 : 800),
    [clampWidth],
  )

  const resolvePreferredWidth = useCallback(() => {
    const ui = getUISettings()
    const halfScreen = getHalfScreenWidth()
    return Math.min(isAllView ? (ui.aiColWidthAll ?? halfScreen) : ui.aiColWidth, timelineMaxWidth)
  }, [getHalfScreenWidth, isAllView, timelineMaxWidth])

  // Calculate initial width depending on view
  const initialAiWidth = useMemo(() => resolvePreferredWidth(), [resolvePreferredWidth])
  const aiPanelStartDragPosition = useRef(0)

  const {
    position: aiPanelWidth,
    separatorProps: aiSeparatorProps,
    isDragging: isAiPanelDragging,
    separatorCursor: aiSeparatorCursor,
    setPosition: setAiPanelWidth,
  } = useResizable({
    axis: "x",
    min: minWidth,
    max: maxWidth,
    initial: initialAiWidth,
    reverse: true,
    onResizeStart({ position }) {
      aiPanelStartDragPosition.current = position
    },
    onResizeEnd({ position }) {
      if (position === aiPanelStartDragPosition.current) return
      // Persist per-view width
      setUISetting(isAllView ? "aiColWidthAll" : "aiColWidth", position)
      // TODO: Remove this after useMeasure can get bounds in time
      window.dispatchEvent(new Event("resize"))
    },
  })

  // When view changes, switch to the saved width for that view
  useEffect(() => {
    const width = resolvePreferredWidth()
    setAiPanelWidth(width)
    // Trigger layout update
    window.dispatchEvent(new Event("resize"))
  }, [resolvePreferredWidth, setAiPanelWidth])

  const handleTimelineTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (
        event.propertyName !== "width" ||
        event.target !== event.currentTarget ||
        !showEntryDetailsColumn
      ) {
        return
      }
      setShouldRenderDetailsColumn(true)
    },
    [showEntryDetailsColumn],
  )

  useEffect(() => {
    if (!showEntryDetailsColumn) {
      setShouldRenderDetailsColumn(false)
    }
  }, [showEntryDetailsColumn])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      setShouldRenderDetailsColumn(showEntryDetailsColumn)
      return
    }
  }, [showEntryDetailsColumn])

  return (
    <div ref={layoutContainerRef} className="relative flex min-w-0 grow">
      <div className="relative min-w-0 flex-1">
        <AppLayoutGridContainerProvider>
          <div className="relative h-full">
            <div
              className={cn(
                "absolute inset-y-0 left-0 min-w-[300px] transition-[width] duration-200 ease-out",
                showEntryDetailsColumn && "border-r will-change-[width]",
                isTimelineDragging && "transition-none",
                aiPanelStyle === AIChatPanelStyle.Fixed && !showEntryDetailsColumn && "border-r",
              )}
              onTransitionEnd={handleTimelineTransitionEnd}
              style={{ width: showEntryDetailsColumn ? timelineColumnWidth : "100%" }}
            >
              <div className="relative h-full">
                {/* Entry list - always rendered to prevent animation */}
                <EntryColumn key="entry-list" />
                {!showEntryDetailsColumn && (
                  <>
                    <AnimatePresence>
                      {realEntryId && (
                        <m.div
                          className="absolute inset-x-0 top-0 z-10"
                          initial={{ translateY: "-50px", opacity: 0 }}
                          animate={{ translateY: 0, opacity: 1 }}
                          exit={{ translateY: "-50px", opacity: 0 }}
                          transition={Spring.smooth(0.3)}
                        >
                          <AIEntryHeader entryId={realEntryId} />
                        </m.div>
                      )}
                    </AnimatePresence>
                    {/* Entry content overlay with exit animation */}
                    <AnimatePresence>
                      {realEntryId && (
                        <div className="pointer-events-none absolute inset-0 z-[9] flex flex-col overflow-hidden">
                          <m.div
                            lcpOptimization
                            initial={{ translateY: "50px", opacity: 0, scale: 0.98 }}
                            animate={{ translateY: 0, opacity: 1, scale: 1 }}
                            exit={{ translateY: "50px", opacity: 0, scale: 0.98 }}
                            transition={Spring.smooth(0.3)}
                            className="pointer-events-auto relative flex h-0 flex-1 flex-col bg-theme-background"
                          >
                            <EntryContent entryId={realEntryId} className="h-full" />
                          </m.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>

            {showEntryDetailsColumn && shouldRenderDetailsColumn && (
              <>
                <div className="absolute inset-y-0 z-[2]" style={{ left: timelineColumnWidth }}>
                  <PanelSplitter
                    {...timelineSeparatorProps}
                    cursor={timelineSeparatorCursor}
                    isDragging={isTimelineDragging}
                    onDoubleClick={() => {
                      setUISetting("entryColWidth", defaultUISettings.entryColWidth)
                      setTimelineColumnWidth(defaultUISettings.entryColWidth)
                      window.dispatchEvent(new Event("resize"))
                    }}
                  />
                </div>
                <div
                  className="absolute inset-y-0 right-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-theme-background"
                  style={{ left: timelineColumnWidth }}
                >
                  {realEntryId ? (
                    <>
                      <div className="absolute inset-x-0 top-0 z-10">
                        <AIEntryHeader entryId={realEntryId} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 z-[9] flex flex-col overflow-hidden">
                        <div className="pointer-events-auto relative flex h-0 flex-1 flex-col bg-theme-background">
                          <EntryContent entryId={realEntryId} className="h-full" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center px-8">
                      <EntryContentPlaceholder />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </AppLayoutGridContainerProvider>
      </div>

      {/* Fixed panel layout */}
      {aiSidebarVisible && (
        <>
          <PanelSplitter
            {...aiSeparatorProps}
            cursor={aiSeparatorCursor}
            isDragging={isAiPanelDragging}
            onDoubleClick={() => {
              const resetWidth = isAllView
                ? getHalfScreenWidth()
                : clampWidth(defaultUISettings.aiColWidth)
              setUISetting(isAllView ? "aiColWidthAll" : "aiColWidth", resetWidth)
              setAiPanelWidth(resetWidth)
              window.dispatchEvent(new Event("resize"))
            }}
          />
          <AIChatLayout
            key="ai-chat-layout"
            style={
              {
                width: aiPanelWidth,
                "--ai-chat-layout-width": `${aiPanelWidth}px`,
              } as React.CSSProperties
            }
          />
        </>
      )}

      {/* Floating panel - renders outside layout flow */}
      {aiPanelStyle === AIChatPanelStyle.Floating && <AIChatLayout key="ai-chat-layout" />}
    </div>
  )
}

export const AIEnhancedTimelineLayout = memo(function AIEnhancedTimelineLayout() {
  const aiEnabled = useFeature("ai")
  return (
    <AIChatRoot wrapFocusable={false}>
      <AIEnhancedTimelineLayoutImpl />
      {aiEnabled && <AIIndicator />}
      <MainViewHotkeysProvider />
    </AIChatRoot>
  )
})
AIEnhancedTimelineLayout.displayName = "AIEnhancedTimelineLayout"
