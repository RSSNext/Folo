import { Spring } from "@follow/components/constants/spring.js"
import { PanelSplitter } from "@follow/components/ui/divider/index.js"
import { FeedViewType } from "@follow/constants"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { AnimatePresence } from "motion/react"
import { memo, startTransition, useCallback, useEffect, useMemo, useRef } from "react"
import { useResizable } from "react-resizable-layout"

import { AIChatPanelStyle, useAIChatPanelStyle, useAIPanelVisibility } from "~/atoms/settings/ai"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { getUISettings, setUISetting } from "~/atoms/settings/ui"
import { setSubscriptionColumnApronNode, useSubscriptionEntryPlaneVisible } from "~/atoms/sidebar"
import { m } from "~/components/common/Motion"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"
import { AIChatLayout } from "~/modules/app-layout/ai/AIChatLayout"
import { AIIndicator } from "~/modules/app-layout/ai/AISplineButton"
import { EntryColumn } from "~/modules/entry-column"
import { EntryPlaneToolbar } from "~/modules/entry-column/components/EntryPlaneToolbar"
import { EntrySubscriptionList } from "~/modules/entry-column/EntrySubscriptionList"
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

  const { view, isAllFeeds, entryId } = useRouteParamsSelector((s) => ({
    view: s.view,
    isAllFeeds: s.isAllFeeds,
    entryId: s.entryId,
  }))
  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId

  // AI chat resizable panel configuration
  const isAllView = view === FeedViewType.All && isAllFeeds && !realEntryId
  const widthRange: [number, number] = isAllView ? [500, 1200] : [300, 1200]
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
    return isAllView ? (ui.aiColWidthAll ?? halfScreen) : ui.aiColWidth
  }, [getHalfScreenWidth, isAllView])

  // Calculate initial width depending on view
  const initialAiWidth = useMemo(() => resolvePreferredWidth(), [resolvePreferredWidth])
  const startDragPosition = useRef(0)

  const { position, separatorProps, isDragging, separatorCursor, setPosition } = useResizable({
    axis: "x",
    min: minWidth,
    max: maxWidth,
    initial: initialAiWidth,
    reverse: true,
    onResizeStart({ position }) {
      startDragPosition.current = position
    },
    onResizeEnd({ position }) {
      if (position === startDragPosition.current) return
      // Persist per-view width
      setUISetting(isAllView ? "aiColWidthAll" : "aiColWidth", position)
      // TODO: Remove this after useMeasure can get bounds in time
      window.dispatchEvent(new Event("resize"))
    },
  })

  // When view changes, switch to the saved width for that view
  useEffect(() => {
    const width = resolvePreferredWidth()
    setPosition(width)
    // Trigger layout update
    window.dispatchEvent(new Event("resize"))
  }, [resolvePreferredWidth])

  const showCompactTimelineColumn = useGeneralSettingKey("showCompactTimelineInSub")
  return (
    <div className="relative flex min-w-0 grow">
      <div
        className={cn(
          "h-full min-w-[300px] flex-1",
          aiPanelStyle === AIChatPanelStyle.Fixed && "border-r",
        )}
      >
        <AppLayoutGridContainerProvider>
          <div className="relative h-full">
            {/* Entry list - always rendered to prevent animation */}
            <EntryColumn key="entry-list" />
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
                    className="bg-theme-background pointer-events-auto relative flex h-0 flex-1 flex-col"
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
      {aiSidebarVisible && (
        <>
          <PanelSplitter
            {...separatorProps}
            cursor={separatorCursor}
            isDragging={isDragging}
            onDoubleClick={() => {
              const resetWidth = isAllView
                ? getHalfScreenWidth()
                : clampWidth(defaultUISettings.aiColWidth)
              setUISetting(isAllView ? "aiColWidthAll" : "aiColWidth", resetWidth)
              setPosition(resetWidth)
              window.dispatchEvent(new Event("resize"))
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
      {aiPanelStyle === AIChatPanelStyle.Floating && <AIChatLayout key="ai-chat-layout" />}
      {showCompactTimelineColumn && <SubscriptionColumnToggler />}
    </div>
  )
}

export const AIEnhancedTimelineLayout = memo(function AIEnhancedTimelineLayout() {
  return (
    <AIChatRoot wrapFocusable={false}>
      <AIEnhancedTimelineLayoutImpl />
      <AIIndicator />
      <MainViewHotkeysProvider />
    </AIChatRoot>
  )
})
AIEnhancedTimelineLayout.displayName = "AIEnhancedTimelineLayout"

const SubscriptionColumnToggler = () => {
  const isInEntry = useRouteParamsSelector((s) => s.entryId !== ROUTE_ENTRY_PENDING)

  useEffect(() => {
    if (isInEntry) {
      startTransition(() => {
        setSubscriptionColumnApronNode(<SubscriptionEntryListPlaneNode />)
      })
      return () => {
        startTransition(() => {
          setSubscriptionColumnApronNode(null)
        })
      }
    }
  }, [isInEntry])
  return null
}

const SubscriptionEntryListPlaneNode = () => {
  const entryId = useRouteParamsSelector((s) => s.entryId)
  const isVisible = useSubscriptionEntryPlaneVisible()

  return (
    <m.div
      className={cn(
        "bg-sidebar backdrop-blur-background absolute left-0 top-12 z-[2] rounded-r-lg",
        isVisible ? "w-feed-col bottom-0 flex flex-col" : "w-[40px]",
      )}
      id="subscription-entry-list-plane-node"
      initial={false}
      animate={{
        width: isVisible ? "var(--fo-feed-col-w, 256px)" : "40px",
      }}
      transition={Spring.presets.smooth}
    >
      <EntryPlaneToolbar />
      <AnimatePresence mode="popLayout">
        {isVisible && (
          <m.div
            key="entry-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="w-feed-col flex flex-1 flex-col whitespace-pre"
          >
            <EntrySubscriptionList scrollToEntryId={entryId} />
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
