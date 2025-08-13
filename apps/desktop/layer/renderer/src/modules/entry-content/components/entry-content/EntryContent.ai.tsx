import { Spring } from "@follow/components/constants/spring.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { FeedViewType } from "@follow/constants"
import { useTitle } from "@follow/hooks"
import type { FeedModel } from "@follow/models/types"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsInbox } from "@follow/store/inbox/hooks"
import { thenable } from "@follow/utils"
import { stopPropagation } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { cn } from "@follow/utils/utils"
import type { JSAnimation } from "motion/react"
import { m, useAnimationControls } from "motion/react"
import * as React from "react"
import { memo, useEffect, useRef, useState } from "react"

import { useEntryIsInReadability } from "~/atoms/readability"
import { useIsZenMode } from "~/atoms/settings/ui"
import { Focusable } from "~/components/common/Focusable"
import { useInPeekModal } from "~/components/ui/modal/inspire/InPeekModal"
import { HotkeyScope } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useFeedSafeUrl } from "~/hooks/common/useFeedSafeUrl"
import { useBlockActions } from "~/modules/ai-chat/store/hooks"
import { BlockSliceAction } from "~/modules/ai-chat/store/slices/block.slice"
import { COMMAND_ID } from "~/modules/command/commands/id"

import { ApplyEntryActions } from "../../ApplyEntryActions"
import { useEntryContent } from "../../hooks"
import { AIEntryHeader } from "../entry-header"
import { EntryTimeline } from "../EntryTimelineSidebar"
import { getEntryContentLayout } from "../layouts"
import { SourceContentPanel } from "../SourceContentView"
import { EntryCommandShortcutRegister } from "./EntryCommandShortcutRegister"
import { EntryContentLoading } from "./EntryContentLoading"
import { EntryNoContent } from "./EntryNoContent"
import { EntryScrollingAndNavigationHandler } from "./EntryScrollingAndNavigationHandler.js"
import type { EntryContentProps } from "./types"

const contentVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30 },
}
const EntryContentImpl: Component<EntryContentProps> = ({
  entryId,
  noMedia,
  className,
  compact,
  classNames,
}) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, inboxHandle } = state
    const { title, url } = state

    return { feedId, inboxId: inboxHandle, title, url }
  })
  if (!entry) throw thenable

  useTitle(entry.title)
  const feed = useFeedById(entry.feedId)

  const isInbox = useIsInbox(entry.inboxId)
  const isInReadabilityMode = useEntryIsInReadability(entryId)

  const { error, content, isPending } = useEntryContent(entryId)

  const view = useRouteParamsSelector((route) => route.view)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const safeUrl = useFeedSafeUrl(entryId)

  const isZenMode = useIsZenMode()

  const [panelPortalElement, setPanelPortalElement] = useState<HTMLDivElement | null>(null)

  const scrollAnimationRef = useRef<JSAnimation<any> | null>(null)

  const isInHasTimelineView = ![
    FeedViewType.Pictures,
    FeedViewType.SocialMedia,
    FeedViewType.Videos,
  ].includes(view)

  const { addOrUpdateBlock, removeBlock } = useBlockActions()
  useEffect(() => {
    addOrUpdateBlock({
      id: BlockSliceAction.SPECIAL_TYPES.mainEntry,
      type: "mainEntry",
      value: entryId,
    })
    return () => {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.mainEntry)
    }
  }, [addOrUpdateBlock, entryId, removeBlock])
  const animationController = useAnimationControls()

  useEffect(() => {
    animationController.set(contentVariants.exit)
    animationController.start(contentVariants.animate)
    return () => {
      animationController.stop()
    }
  }, [animationController, entryId])

  return (
    <div className={cn(className, "@container flex flex-col")}>
      <EntryCommandShortcutRegister entryId={entryId} view={view} />
      <AIEntryHeader
        entryId={entryId}
        className={cn("@container h-[55px] shrink-0 px-3", classNames?.header)}
        compact={compact}
      />
      <div className="w-full" ref={setPanelPortalElement} />

      <Focusable
        scope={HotkeyScope.EntryRender}
        className="@container relative flex min-h-0 w-full flex-1 flex-col overflow-hidden print:size-auto print:overflow-visible"
      >
        <RootPortal to={panelPortalElement}>
          <EntryScrollingAndNavigationHandler
            scrollAnimationRef={scrollAnimationRef}
            scrollerRef={scrollerRef}
          />
        </RootPortal>
        <EntryTimeline entryId={entryId} className="top-48" />
        <EntryScrollArea scrollerRef={scrollerRef}>
          {/* Indicator for the entry */}
          {!isZenMode && isInHasTimelineView && (
            <>
              <div className="absolute inset-y-0 left-0 z-[9] flex w-12 items-center justify-center opacity-40 duration-200 hover:opacity-100">
                <MotionButtonBase
                  // -12： Visual center point
                  className="absolute left-0 shrink-0 !-translate-y-12 cursor-pointer"
                  onClick={() => {
                    EventBus.dispatch(COMMAND_ID.timeline.switchToPrevious)
                  }}
                >
                  <i className="i-mgc-left-small-sharp text-text-secondary size-16" />
                </MotionButtonBase>
              </div>

              <div className="absolute inset-y-0 right-0 z-[9] flex w-12 items-center justify-center opacity-40 duration-200 hover:opacity-100">
                <MotionButtonBase
                  className="absolute right-0 shrink-0 !-translate-y-12 cursor-pointer"
                  onClick={() => {
                    EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
                  }}
                >
                  <i className="i-mgc-right-small-sharp text-text-secondary size-16" />
                </MotionButtonBase>
              </div>
            </>
          )}
          <m.div
            className="select-text"
            initial={{ opacity: 0, y: 30 }}
            animate={animationController}
            transition={Spring.presets.smooth}
          >
            <article
              data-testid="entry-render"
              onContextMenu={stopPropagation}
              className={"relative w-full min-w-0 pb-10 pt-2"}
            >
              <ApplyEntryActions entryId={entryId} key={entryId} />

              {!content && !isInReadabilityMode ? (
                <div className="center mt-16 min-w-0">
                  {isPending ? (
                    <EntryContentLoading
                      icon={!isInbox ? (feed as FeedModel)?.siteUrl : undefined}
                    />
                  ) : error ? (
                    <div className="center mt-36 flex flex-col items-center gap-3">
                      <i className="i-mgc-warning-cute-re text-red text-4xl" />
                      <span className="text-balance text-center text-sm">Network Error</span>
                      <pre className="mt-6 w-full overflow-auto whitespace-pre-wrap break-all">
                        {error.message}
                      </pre>
                    </div>
                  ) : (
                    <EntryNoContent id={entryId} url={entry.url ?? ""} />
                  )}
                </div>
              ) : (
                <AdaptiveContentRenderer
                  entryId={entryId}
                  view={view}
                  compact={compact}
                  noMedia={noMedia}
                />
              )}
            </article>
          </m.div>
        </EntryScrollArea>
        <SourceContentPanel src={safeUrl ?? "#"} />
      </Focusable>

      {/* <React.Suspense>{!isInPeekModal && <AISmartSidebar entryId={entryId} />}</React.Suspense> */}
    </div>
  )
}
export const EntryContent = memo(EntryContentImpl)

const EntryScrollArea: Component<{
  scrollerRef: React.RefObject<HTMLDivElement | null>
}> = ({ children, className, scrollerRef }) => {
  const isInPeekModal = useInPeekModal()

  if (isInPeekModal) {
    return <div className="p-5">{children}</div>
  }
  return (
    <ScrollArea.ScrollArea
      focusable
      mask={false}
      viewportProps={{
        onWheel: stopPropagation,
      }}
      flex
      rootClassName={cn(
        "flex-1 min-h-0 overflow-y-auto print:h-auto print:overflow-visible",
        className,
      )}
      scrollbarClassName="mr-[1.5px] print:hidden"
      ref={scrollerRef}
    >
      {children}
    </ScrollArea.ScrollArea>
  )
}

const AdaptiveContentRenderer: React.FC<{
  entryId: string
  view: FeedViewType
  compact?: boolean
  noMedia?: boolean
}> = ({ entryId, view, compact = false, noMedia = false }) => {
  const LayoutComponent = getEntryContentLayout(view)

  return <LayoutComponent entryId={entryId} compact={compact} noMedia={noMedia} />
}
