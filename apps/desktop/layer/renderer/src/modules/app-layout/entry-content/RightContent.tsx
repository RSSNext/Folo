import { views } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { useWheel } from "@use-gesture/react"
import { easeOut } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { useState } from "react"
import { useParams } from "react-router"

import { useRealInWideMode } from "~/atoms/settings/ui"
import { useTimelineColumnShow, useTimelineColumnTempShow } from "~/atoms/sidebar"
import { m } from "~/components/common/Motion"
import { FixedModalCloseButton } from "~/components/ui/modal/components/close"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

import { EntryContentPlaceholder } from "./EntryContentPlaceholder"

export const RightContent = () => {
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
      <EntryGridContainer showEntryContent={showEntryContent} wideMode={wideMode}>
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

const EntryGridContainer: FC<
  PropsWithChildren<{
    showEntryContent: boolean
    wideMode: boolean
  }>
> = ({ children, showEntryContent, wideMode }) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>()

  const navigate = useNavigateEntry()
  useWheel(
    ({ delta: [dex] }) => {
      if (dex < -50) {
        navigate({ entryId: null })
      }
    },
    {
      enabled: showEntryContent && wideMode,
      target: containerRef!,
      eventOptions: { capture: true },
      axis: "x",
    },
  )

  if (wideMode) {
    return (
      <m.div
        ref={setContainerRef}
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
    return (
      <div ref={setContainerRef} className="flex min-w-0 flex-1 flex-col">
        {children}
      </div>
    )
  }
}
