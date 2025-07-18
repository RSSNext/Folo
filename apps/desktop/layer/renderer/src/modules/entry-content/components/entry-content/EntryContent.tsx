import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
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
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { clsx, cn } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import type { JSAnimation, Variants } from "motion/react"
import { m, useAnimationControls } from "motion/react"
import * as React from "react"
import { memo, useEffect, useMemo, useRef, useState } from "react"

import { useEntryIsInReadability } from "~/atoms/readability"
import { useIsZenMode, useUISettingKey } from "~/atoms/settings/ui"
import { Focusable } from "~/components/common/Focusable"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import type { TocRef } from "~/components/ui/markdown/components/Toc"
import { useInPeekModal } from "~/components/ui/modal/inspire/InPeekModal"
import { HotkeyScope } from "~/constants"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useFeedSafeUrl } from "~/hooks/common/useFeedSafeUrl"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { EntryContentHTMLRenderer } from "~/modules/renderer/html"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"

import { AISummary } from "../../AISummary"
import { ApplyEntryActions } from "../../ApplyEntryActions"
import { useEntryContent, useEntryMediaInfo } from "../../hooks"
import { EntryHeader } from "../entry-header"
import { EntryAttachments } from "../EntryAttachments"
import { EntryTimelineSidebar } from "../EntryTimelineSidebar"
import { EntryTitle } from "../EntryTitle"
import { SourceContentPanel } from "../SourceContentView"
import { SupportCreator } from "../SupportCreator"
import { EntryContentAccessories } from "./accessories"
import { AISmartSidebar } from "./ai"
import { EntryCommandShortcutRegister } from "./EntryCommandShortcutRegister"
import { EntryContentLoading } from "./EntryContentLoading"
import { EntryNoContent } from "./EntryNoContent"
import { EntryRenderError } from "./EntryRenderError"
import { EntryScrollingAndNavigationHandler } from "./EntryScrollingAndNavigationHandler.js"
import { EntryTitleMetaHandler } from "./EntryTitleMetaHandler"
import { ReadabilityNotice } from "./ReadabilityNotice"
import type { EntryContentProps } from "./types"

const pageMotionVariants = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 25, transition: { duration: 0 } },
} satisfies Variants

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
  useTitle(entry?.title)

  const feed = useFeedById(entry?.feedId)

  const isInbox = useIsInbox(entry?.inboxId)
  const isInReadabilityMode = useEntryIsInReadability(entryId)

  const { error, content, isPending } = useEntryContent(entryId)

  const view = useRouteParamsSelector((route) => route.view)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const safeUrl = useFeedSafeUrl(entryId)
  const customCSS = useUISettingKey("customCSS")

  const isInPeekModal = useInPeekModal()
  const isZenMode = useIsZenMode()

  const [panelPortalElement, setPanelPortalElement] = useState<HTMLDivElement | null>(null)

  const animationController = useAnimationControls()
  const prevEntryId = useRef<string | undefined>(undefined)
  const scrollAnimationRef = useRef<JSAnimation<any> | null>(null)
  useEffect(() => {
    if (prevEntryId.current !== entryId) {
      scrollAnimationRef.current?.stop()
      nextFrame(() => {
        scrollerRef.current?.scrollTo({ top: 0 })
      })
      animationController.start(pageMotionVariants.exit).then(() => {
        animationController.start(pageMotionVariants.animate)
      })
      prevEntryId.current = entryId
    }
  }, [animationController, entryId])

  const isInHasTimelineView = ![
    FeedViewType.Pictures,
    FeedViewType.SocialMedia,
    FeedViewType.Videos,
  ].includes(view)
  if (!entry) return null

  return (
    <>
      <EntryCommandShortcutRegister entryId={entryId} view={view} />
      {!isInPeekModal && (
        <EntryHeader
          entryId={entryId}
          view={view}
          className={cn("@container h-[55px] shrink-0 px-3", classNames?.header)}
          compact={compact}
        />
      )}
      <div className="w-full" ref={setPanelPortalElement} />

      <Focusable
        scope={HotkeyScope.EntryRender}
        className="@container relative flex size-full flex-col overflow-hidden print:size-auto print:overflow-visible"
      >
        <RootPortal to={panelPortalElement}>
          <EntryScrollingAndNavigationHandler
            scrollAnimationRef={scrollAnimationRef}
            scrollerRef={scrollerRef}
          />
        </RootPortal>
        <EntryTimelineSidebar entryId={entryId} />
        <EntryScrollArea className={className} scrollerRef={scrollerRef}>
          {/* Indicator for the entry */}
          <m.div
            initial={pageMotionVariants.initial}
            animate={animationController}
            transition={Spring.presets.bouncy}
            className="select-text"
          >
            {!isZenMode && isInHasTimelineView && !isInPeekModal && (
              <>
                <div className="absolute inset-y-0 left-0 flex w-12 items-center justify-center opacity-0 duration-200 hover:opacity-100">
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

                <div className="absolute inset-y-0 right-0 flex w-12 items-center justify-center opacity-0 duration-200 hover:opacity-100">
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

            <article
              data-testid="entry-render"
              onContextMenu={stopPropagation}
              className={clsx(
                "relative m-auto min-w-0",
                isInPeekModal
                  ? "max-w-full"
                  : "@[950px]:max-w-[70ch] @7xl:max-w-[80ch] max-w-[550px]",
              )}
            >
              <EntryTitle entryId={entryId} compact={compact} />

              <WrappedElementProvider boundingDetection>
                <div className="mx-auto mb-32 mt-8 max-w-full cursor-auto text-[0.94rem]">
                  <EntryTitleMetaHandler entryId={entryId} />
                  <AISummary entryId={entryId} />
                  <ErrorBoundary fallback={EntryRenderError}>
                    <ReadabilityNotice entryId={entryId} />
                    <ShadowDOM injectHostStyles={!isInbox}>
                      {!!customCSS && (
                        <MemoedDangerousHTMLStyle>{customCSS}</MemoedDangerousHTMLStyle>
                      )}

                      <Renderer
                        entryId={entryId}
                        view={view}
                        feedId={feed?.id || ""}
                        noMedia={noMedia}
                        content={content}
                      />
                    </ShadowDOM>
                  </ErrorBoundary>
                </div>
              </WrappedElementProvider>

              <ApplyEntryActions entryId={entryId} key={entryId} />

              {!content && !isInReadabilityMode && (
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
              )}

              <EntryAttachments entryId={entryId} />
              <SupportCreator entryId={entryId} />
            </article>
          </m.div>
        </EntryScrollArea>
        <SourceContentPanel src={safeUrl ?? "#"} />
      </Focusable>

      <React.Suspense>{!isInPeekModal && <AISmartSidebar entryId={entryId} />}</React.Suspense>
    </>
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
      stopWheelPropagation={false}
      rootClassName={cn(
        "h-0 min-w-0 grow overflow-y-auto print:h-auto print:overflow-visible",
        className,
      )}
      scrollbarClassName="mr-[1.5px] print:hidden"
      viewportClassName="p-5"
      ref={scrollerRef}
    >
      {children}
    </ScrollArea.ScrollArea>
  )
}

const Renderer: React.FC<{
  entryId: string
  view: FeedViewType
  feedId: string
  noMedia?: boolean
  content?: Nullable<string>
}> = React.memo(({ entryId, view, feedId, noMedia = false, content = "" }) => {
  const mediaInfo = useEntryMediaInfo(entryId)

  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")

  const stableRenderStyle = useRenderStyle()
  const isInPeekModal = useInPeekModal()

  const tocRef = useRef<TocRef | null>(null)
  const contentAccessories = useMemo(
    () => (isInPeekModal ? undefined : <EntryContentAccessories ref={{ tocRef }} />),
    [isInPeekModal],
  )

  useEffect(() => {
    if (tocRef) {
      tocRef.current?.refreshItems()
    }
  }, [content, tocRef])
  return (
    <EntryContentHTMLRenderer
      view={view}
      feedId={feedId}
      entryId={entryId}
      mediaInfo={mediaInfo}
      noMedia={noMedia}
      accessory={contentAccessories}
      as="article"
      className="prose dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold !max-w-full hyphens-auto"
      style={stableRenderStyle}
      renderInlineStyle={readerRenderInlineStyle}
    >
      {content}
    </EntryContentHTMLRenderer>
  )
})
