import { PanelSplitter } from "@follow/components/ui/divider/PanelSplitter.js"
import { views } from "@follow/constants"
import { clsx, cn } from "@follow/utils/utils"
import { easeOut } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { useMemo } from "react"
import { useResizable } from "react-resizable-layout"
import { useParams } from "react-router"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { useRealInWideMode } from "~/atoms/settings/ui"
import { useTimelineColumnShow, useTimelineColumnTempShow } from "~/atoms/sidebar"
import { m } from "~/components/common/Motion"
import { FixedModalCloseButton } from "~/components/ui/modal/components/close"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useFeature } from "~/hooks/biz/useFeature"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { EntryContentPlaceholder } from "./EntryContentPlaceholder"

const EntryLayoutContentLegacy = () => {
  const { entryId } = useParams()
  const { view } = useRouteParams()
  const navigate = useNavigateEntry()

  const settingWideMode = useRealInWideMode()
  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const showEntryContent = !(views[view]!.wideMode || (settingWideMode && !realEntryId))
  const wideMode = !!(settingWideMode && realEntryId)
  const feedColumnTempShow = useTimelineColumnTempShow()
  const feedColumnShow = useTimelineColumnShow()
  const shouldHeaderPaddingLeft = feedColumnTempShow && !feedColumnShow && settingWideMode

  if (!showEntryContent) {
    return null
  }

  return (
    <AppLayoutGridContainerProvider>
      <EntryGridContainer wideMode={wideMode}>
        {wideMode && (
          <FixedModalCloseButton
            className="no-drag-region macos:translate-y-margin-macos-traffic-light-y absolute left-4 top-4 z-10"
            onClick={() => navigate({ entryId: null })}
          />
        )}
        {realEntryId ? (
          <EntryContent
            entryId={realEntryId}
            classNames={{
              header: shouldHeaderPaddingLeft
                ? "ml-[calc(theme(width.feed-col)+theme(width.8))]"
                : wideMode
                  ? "ml-12"
                  : "",
            }}
          />
        ) : !settingWideMode ? (
          <EntryContentPlaceholder />
        ) : null}
      </EntryGridContainer>
    </AppLayoutGridContainerProvider>
  )
}
export const EntryLayoutContentWithAI = () => {
  const { entryId, view } = useRouteParams()
  const navigate = useNavigateEntry()

  const settingWideMode = useRealInWideMode()
  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const wideMode = !!(settingWideMode && realEntryId)

  const isWideView = views[view]?.wideMode
  return (
    <AppLayoutGridContainerProvider>
      <EntryGridContainer wideMode={wideMode}>
        {wideMode && (
          <FixedModalCloseButton
            className="no-drag-region macos:translate-y-margin-macos-traffic-light-y absolute left-4 top-4 z-10"
            onClick={() => navigate({ entryId: null })}
          />
        )}
        {realEntryId && !isWideView ? <Grid entryId={realEntryId} /> : null}
      </EntryGridContainer>
    </AppLayoutGridContainerProvider>
  )
}

export const EntryLayoutContent = () => {
  const aiEnabled = useFeature("ai")
  if (aiEnabled) {
    return <EntryLayoutContentWithAI />
  }
  return <EntryLayoutContentLegacy />
}
const Grid = ({ entryId }) => {
  const settingWideMode = useRealInWideMode()

  const wideMode = !!(settingWideMode && entryId)
  const feedColumnTempShow = useTimelineColumnTempShow()
  const feedColumnShow = useTimelineColumnShow()
  const panelStyle = useAIChatPanelStyle()
  const aiPinned = panelStyle === AIChatPanelStyle.Fixed
  const shouldHeaderPaddingLeft = feedColumnTempShow && !feedColumnShow && settingWideMode

  const { isDragging, position, separatorProps, separatorCursor } = useResizable({
    axis: "x",
    min: 300,
    max: 500,
    initial: 400,
    reverse: true,
  })

  return (
    <div
      className={clsx(
        aiPinned && "grid grid-cols-[1fr_400px]",
        "flex min-h-0 grow flex-col overflow-hidden",
      )}
      style={{
        gridTemplateColumns: `1fr ${position}px`,
      }}
    >
      <div className="flex min-h-0 grow flex-col overflow-hidden">
        <EntryContent
          entryId={entryId}
          classNames={useMemo(() => {
            return {
              header: shouldHeaderPaddingLeft
                ? "ml-[calc(theme(width.feed-col)+theme(width.8))]"
                : wideMode
                  ? "ml-12"
                  : "",
            }
          }, [shouldHeaderPaddingLeft, wideMode])}
        />
      </div>
      {aiPinned && (
        <div className="relative flex min-h-0 grow flex-col border-l">
          <PanelSplitter
            className="absolute inset-y-0 left-0"
            isDragging={isDragging}
            cursor={separatorCursor}
            {...separatorProps}
          />
        </div>
      )}
    </div>
  )
}

const EntryGridContainer: FC<
  PropsWithChildren<{
    wideMode: boolean
  }>
> = ({ children, wideMode }) => {
  if (!children) return null
  if (Array.isArray(children) && children.filter(Boolean).length === 0) {
    return null
  }
  if (wideMode) {
    return (
      <m.div
        // slide up
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100, transition: { duration: 0.2, ease: easeOut } }}
        transition={{ duration: 0.2, type: "spring" }}
        className={cn("flex min-w-0 flex-1 flex-col", "bg-theme-background absolute inset-0 z-10")}
      >
        {children}
      </m.div>
    )
  } else {
    return <div className="flex min-w-0 flex-1 flex-col">{children}</div>
  }
}
