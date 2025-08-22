import type { DragEndEvent } from "@dnd-kit/core"
import { DndContext, PointerSensor, pointerWithin, useSensor, useSensors } from "@dnd-kit/core"
import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { PanelSplitter } from "@follow/components/ui/divider/PanelSplitter.js"
import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import type { FeedViewType } from "@follow/constants"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { cn } from "@follow/utils"
import { Slot } from "@radix-ui/react-slot"
import { debounce } from "es-toolkit/compat"
import { AnimatePresence } from "motion/react"
import type { PropsWithChildren } from "react"
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Trans } from "react-i18next"
import { useResizable } from "react-resizable-layout"

import { getIsZenMode, getUISettings, setUISetting } from "~/atoms/settings/ui"
import {
  getTimelineColumnTempShow,
  setTimelineColumnTempShow,
  useTimelineColumnShow,
  useTimelineColumnTempShow,
} from "~/atoms/sidebar"
import { m } from "~/components/common/Motion"
import { FloatingLayerScope } from "~/constants"
import { useFeature } from "~/hooks/biz/useFeature"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { useBatchUpdateSubscription } from "~/hooks/biz/useSubscriptionActions"
import { useI18n } from "~/hooks/common"
import { NetworkStatusIndicator } from "~/modules/app/NetworkStatusIndicator"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"
import { useEntryContentScrollToTop } from "~/modules/entry-content/atoms"
import { CornerPlayer } from "~/modules/player/corner-player"
import { SubscriptionColumn } from "~/modules/subscription-column"
import { getSelectedFeedIds, resetSelectedFeedIds } from "~/modules/subscription-column/atom"
import { UpdateNotice } from "~/modules/update-notice/UpdateNotice"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

export const SubscriptionColumnContainer = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const { mutate } = useBatchUpdateSubscription()
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      if (!event.over) {
        return
      }

      const { category, view } = event.over.data.current as {
        category?: string | null
        view: FeedViewType
      }

      mutate({ category, view, feedIdList: getSelectedFeedIds() })

      resetSelectedFeedIds()
    },
    [mutate],
  )

  return (
    <AppLayoutGridContainerProvider>
      <FeedResponsiveResizerContainer>
        <DndContext
          autoScroll={{ threshold: { x: 0, y: 0.2 } }}
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleDragEnd}
        >
          <SubscriptionColumn>
            <CornerPlayer />

            <UpdateNotice />

            <NetworkStatusIndicator />
          </SubscriptionColumn>
        </DndContext>
      </FeedResponsiveResizerContainer>
    </AppLayoutGridContainerProvider>
  )
}

const FeedResponsiveResizerContainer = ({
  children,
}: {
  children: React.ReactNode
} & PropsWithChildren) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDragging, position, separatorProps, separatorCursor, setPosition } = useResizable({
    axis: "x",
    min: 256,
    max: 300,
    initial: React.useMemo(() => getUISettings().feedColWidth, []),
    containerRef: containerRef as React.RefObject<HTMLElement>,

    onResizeEnd({ position }) {
      setUISetting("feedColWidth", position)
    },
  })

  const aiEnabled = useFeature("ai")
  const feedColumnShow = useTimelineColumnShow()
  const feedColumnTempShow = useTimelineColumnTempShow()
  const { entryId, isPendingEntry, view: currentView } = useRouteParams()
  const navigate = useNavigateEntry()
  const t = useI18n()

  useEffect(() => {
    if (feedColumnShow) {
      setTimelineColumnTempShow(false)
      return
    }
    const handler = debounce(
      (e: MouseEvent) => {
        const mouseX = e.clientX
        const mouseY = e.clientY

        const uiSettings = getUISettings()
        const feedColumnTempShow = getTimelineColumnTempShow()
        const isInEntryContentWideMode = uiSettings.wideMode || getIsZenMode()
        const feedWidth = uiSettings.feedColWidth
        if (mouseY < 200 && isInEntryContentWideMode && mouseX < feedWidth) return
        const threshold = feedColumnTempShow ? uiSettings.feedColWidth : 100

        if (mouseX < threshold) {
          setTimelineColumnTempShow(true)
        } else {
          setTimelineColumnTempShow(false)
        }
      },
      36,
      {
        leading: true,
      },
    )

    document.addEventListener("mousemove", handler)
    return () => {
      document.removeEventListener("mousemove", handler)
    }
  }, [feedColumnShow])

  const when = useGlobalFocusableScopeSelector(
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-callback
    React.useCallback((activeScope) => !activeScope.or(...FloatingLayerScope), []),
  )

  useCommandBinding({
    commandId: COMMAND_ID.layout.toggleSubscriptionColumn,
    when,
  })

  const [delayShowSplitter, setDelayShowSplitter] = useState(feedColumnShow)

  useEffect(() => {
    let timer: any
    if (feedColumnShow) {
      timer = setTimeout(() => {
        setDelayShowSplitter(true)
      }, 200)
    } else {
      setDelayShowSplitter(false)
    }

    return () => {
      timer = clearTimeout(timer)
    }
  }, [feedColumnShow])
  const isAtTop = !!useEntryContentScrollToTop()

  return (
    <>
      <div
        data-hide-in-print
        className={cn(
          "shrink-0 overflow-hidden",
          "absolute inset-y-0 z-[2]",
          feedColumnTempShow && !feedColumnShow && "shadow-drawer-to-right z-[12]",
          !feedColumnShow && !feedColumnTempShow ? "-translate-x-full" : "",
          !isDragging ? "duration-200" : "",
        )}
        style={{
          width: `${position}px`,
          // @ts-expect-error
          "--fo-feed-col-w": `${position}px`,
        }}
      >
        <Slot className={!feedColumnShow ? "!bg-sidebar" : ""}>{children}</Slot>

        {/* Semi-transparent overlay with exit hint when in wide mode with entry selected */}
        <AnimatePresence>
          {entryId && !isPendingEntry && aiEnabled && !isAtTop && (
            <m.div
              className="bg-background/80 hover:bg-background/90 center absolute inset-0 z-20 cursor-pointer backdrop-blur-[2px] transition-colors duration-200"
              onClick={() => navigate({ entryId: null, view: currentView })}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-2 rounded-lg">
                <div className="text-text flex items-center gap-2">
                  <i className="i-mgc-up-cute-re text-lg" />
                  <span className="text-sm font-medium">{t("entry.exit_detail")}</span>
                </div>
                <span className="text-text-secondary text-xs">{t("entry.click_to_return")}</span>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div
        data-hide-in-print
        className={!isDragging ? "duration-200" : ""}
        style={{
          width: feedColumnShow ? `${position}px` : 0,
        }}
      />

      {delayShowSplitter && (
        <PanelSplitter
          isDragging={isDragging}
          cursor={separatorCursor}
          {...separatorProps}
          onDoubleClick={() => {
            setUISetting("feedColWidth", defaultUISettings.feedColWidth)
            setPosition(defaultUISettings.feedColWidth)
          }}
          tooltip={
            !isDragging && (
              <>
                <div>
                  {/* <b>Drag</b> to resize */}
                  <Trans t={t} i18nKey="resize.tooltip.drag_to_resize" components={{ b: <b /> }} />
                </div>
                <div className="center">
                  <span>
                    <Trans
                      t={t}
                      i18nKey="resize.tooltip.double_click_to_collapse"
                      components={{ b: <b /> }}
                    />
                  </span>{" "}
                  <Kbd className="ml-1">{"["}</Kbd>
                </div>
              </>
            )
          }
        />
      )}
    </>
  )
}
