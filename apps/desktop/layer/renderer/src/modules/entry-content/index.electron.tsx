import {
  Focusable,
  useFocusable,
  useFocusActions,
} from "@follow/components/common/Focusable/index.js"
import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { Spring } from "@follow/components/constants/spring.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import type { FeedViewType } from "@follow/constants"
import { useTitle } from "@follow/hooks"
import type { FeedModel, InboxModel } from "@follow/models/types"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { springScrollTo } from "@follow/utils/scroller"
import { cn, combineCleanupFunctions } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import type { JSAnimation, Variants } from "motion/react"
import { AnimatePresence, m, useAnimationControls } from "motion/react"
import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useEntryIsInReadability } from "~/atoms/readability"
import { useIsZenMode, useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import type { TocRef } from "~/components/ui/markdown/components/Toc"
import { useInPeekModal } from "~/components/ui/modal/inspire/InPeekModal"
import { HotkeyScope } from "~/constants"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useConditionalHotkeyScope } from "~/hooks/common"
import { useFeedSafeUrl } from "~/hooks/common/useFeedSafeUrl"
import { useHotkeyScope } from "~/providers/hotkey-provider"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { COMMAND_ID } from "../command/commands/id"
import { useCommandBinding } from "../command/hooks/use-command-binding"
import { useCommandHotkey } from "../command/hooks/use-register-hotkey"
import { EntryContentHTMLRenderer } from "../renderer/html"
import { AISummary } from "./AISummary"
import { EntryTimelineSidebar } from "./components/EntryTimelineSidebar"
import { EntryTitle } from "./components/EntryTitle"
import { SourceContentPanel } from "./components/SourceContentView"
import { SupportCreator } from "./components/SupportCreator"
import { EntryHeader } from "./header"
import { useEntryContent, useEntryMediaInfo } from "./hooks"
import type { EntryContentProps } from "./index.shared"
import {
  ContainerToc,
  NoContent,
  ReadabilityAutoToggleEffect,
  ReadabilityNotice,
  RenderError,
  TitleMetaHandler,
  ViewSourceContentAutoToggleEffect,
} from "./index.shared"
import { EntryContentLoading } from "./loading"

const pageMotionVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50, transition: { duration: 0 } },
} satisfies Variants

export const EntryContent: Component<EntryContentProps> = ({
  entryId,
  noMedia,
  className,
  compact,
  classNames,
}) => {
  const entry = useEntry(entryId)
  useTitle(entry?.entries.title)

  const feed = useFeedById(entry?.feedId) as FeedModel | InboxModel

  const inbox = useInboxById(entry?.inboxId, (inbox) => inbox !== null)
  const isInbox = !!inbox
  const isInReadabilityMode = useEntryIsInReadability(entryId)

  const { error, content, isPending } = useEntryContent(entryId)

  const view = useRouteParamsSelector((route) => route.view)

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const safeUrl = useFeedSafeUrl(entryId)

  const customCSS = useUISettingKey("customCSS")

  const isInPeekModal = useInPeekModal()

  const [isUserInteraction, setIsUserInteraction] = useState(false)
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

  if (!entry) return null

  return (
    <>
      {!isInPeekModal && (
        <EntryHeader
          entryId={entry.entries.id}
          view={view}
          className={cn("@container h-[55px] shrink-0 px-3", classNames?.header)}
          compact={compact}
        />
      )}
      <div className="w-full" ref={setPanelPortalElement} />

      <Focusable
        className="@container relative flex size-full flex-col overflow-hidden print:size-auto print:overflow-visible"
        onFocus={() => setIsUserInteraction(true)}
      >
        <RootPortal to={panelPortalElement}>
          <RegisterCommands
            scrollAnimationRef={scrollAnimationRef}
            scrollerRef={scrollerRef}
            isUserInteraction={isUserInteraction}
            setIsUserInteraction={setIsUserInteraction}
          />
        </RootPortal>
        <EntryTimelineSidebar entryId={entry.entries.id} />
        <EntryScrollArea className={className} scrollerRef={scrollerRef}>
          {/* Indicator for the entry */}
          <m.div
            initial={pageMotionVariants.initial}
            animate={animationController}
            transition={Spring.presets.smooth}
            className="select-text"
          >
            {!isZenMode && (
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
              tabIndex={-1}
              onFocus={() => setIsUserInteraction(true)}
              data-testid="entry-render"
              onContextMenu={stopPropagation}
              className="@[950px]:max-w-[70ch] @7xl:max-w-[80ch] relative m-auto min-w-0 max-w-[550px]"
            >
              <EntryTitle entryId={entryId} compact={compact} />

              <WrappedElementProvider boundingDetection>
                <div className="mx-auto mb-32 mt-8 max-w-full cursor-auto text-[0.94rem]">
                  <TitleMetaHandler entryId={entry.entries.id} />
                  <AISummary entryId={entry.entries.id} />
                  <ErrorBoundary fallback={RenderError}>
                    <ReadabilityNotice entryId={entryId} />
                    <ShadowDOM injectHostStyles={!isInbox}>
                      {!!customCSS && (
                        <MemoedDangerousHTMLStyle>{customCSS}</MemoedDangerousHTMLStyle>
                      )}

                      <Renderer
                        entryId={entryId}
                        view={view}
                        feedId={feed?.id}
                        noMedia={noMedia}
                        content={content}
                      />
                    </ShadowDOM>
                  </ErrorBoundary>
                </div>
              </WrappedElementProvider>

              {entry.settings?.readability && (
                <ReadabilityAutoToggleEffect id={entry.entries.id} url={entry.entries.url ?? ""} />
              )}
              {entry.settings?.sourceContent && <ViewSourceContentAutoToggleEffect />}

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
                    <NoContent
                      id={entry.entries.id}
                      url={entry.entries.url ?? ""}
                      sourceContent={entry.settings?.sourceContent}
                    />
                  )}
                </div>
              )}

              <SupportCreator entryId={entryId} />
            </article>
          </m.div>
        </EntryScrollArea>
        <SourceContentPanel src={safeUrl ?? "#"} />
      </Focusable>
    </>
  )
}

const EntryScrollArea: Component<{
  scrollerRef: React.RefObject<HTMLDivElement | null>
}> = ({ children, className, scrollerRef }) => {
  const isInPeekModal = useInPeekModal()

  if (isInPeekModal) {
    return <div className="p-5">{children}</div>
  }
  return (
    <ScrollArea.ScrollArea
      focusable={false}
      mask={false}
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
    () => (isInPeekModal ? undefined : <ContainerToc ref={tocRef} />),
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

const RegisterCommands = ({
  scrollerRef,
  isUserInteraction,
  setIsUserInteraction,
  scrollAnimationRef,
}: {
  scrollerRef: React.RefObject<HTMLDivElement | null>
  isUserInteraction: boolean
  setIsUserInteraction: (isUserInteraction: boolean) => void
  scrollAnimationRef: React.RefObject<JSAnimation<any> | null>
}) => {
  const isAlreadyScrolledBottomRef = useRef(false)
  const [showKeepScrollingPanel, setShowKeepScrollingPanel] = useState(false)

  const containerFocused = useFocusable()
  useConditionalHotkeyScope(HotkeyScope.EntryRender, isUserInteraction && containerFocused, true)

  const activeScope = useHotkeyScope()
  const when = activeScope.includes(HotkeyScope.EntryRender)

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.scrollUp,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.scrollDown,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.nextEntry,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.entryRender.previousEntry,
    when,
  })

  useCommandHotkey({
    commandId: COMMAND_ID.layout.focusToTimeline,
    when,
    shortcut: "Backspace, Escape",
  })

  const { highlightBoundary } = useFocusActions()

  useEffect(() => {
    const checkScrollBottom = ($scroller: HTMLDivElement) => {
      const currentScroll = $scroller.scrollTop
      const { scrollHeight, clientHeight } = $scroller

      if (isAlreadyScrolledBottomRef.current) {
        EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
        setShowKeepScrollingPanel(false)
        isAlreadyScrolledBottomRef.current = false
        springScrollTo(0, $scroller)
        return
      }

      if (scrollHeight && clientHeight) {
        isAlreadyScrolledBottomRef.current =
          Math.abs(currentScroll + clientHeight - scrollHeight) < 2
        setShowKeepScrollingPanel(isAlreadyScrolledBottomRef.current)
      }
    }

    const checkScrollBottomByWheel = () => {
      isAlreadyScrolledBottomRef.current = false
      setShowKeepScrollingPanel(false)
    }
    scrollerRef.current?.addEventListener("wheel", checkScrollBottomByWheel)

    const cleanupScrollAnimation = () => {
      scrollAnimationRef.current?.stop()
      scrollAnimationRef.current = null
    }
    return combineCleanupFunctions(
      () => {
        scrollerRef.current?.removeEventListener("wheel", checkScrollBottomByWheel)
      },
      cleanupScrollAnimation,
      EventBus.subscribe(COMMAND_ID.entryRender.scrollUp, () => {
        const currentScroll = scrollerRef.current?.scrollTop
        const delta = window.innerHeight

        if (typeof currentScroll === "number" && delta) {
          cleanupScrollAnimation()
          scrollAnimationRef.current = springScrollTo(currentScroll - delta, scrollerRef.current!)
        }
        checkScrollBottom(scrollerRef.current!)
      }),

      EventBus.subscribe(COMMAND_ID.entryRender.scrollDown, () => {
        const $scroller = scrollerRef.current
        if (!$scroller) {
          return
        }

        const currentScroll = $scroller.scrollTop
        const delta = window.innerHeight

        if (typeof currentScroll === "number" && delta) {
          cleanupScrollAnimation()
          scrollAnimationRef.current = springScrollTo(currentScroll + delta, $scroller)
        }
        checkScrollBottom($scroller)
      }),
      EventBus.subscribe(
        COMMAND_ID.layout.focusToEntryRender,
        ({ highlightBoundary: highlight }) => {
          const $scroller = scrollerRef.current
          if (!$scroller) {
            return
          }

          $scroller.focus()
          if (highlight) {
            nextFrame(highlightBoundary)
          }
          setIsUserInteraction(true)
        },
      ),
    )
  }, [highlightBoundary, scrollAnimationRef, scrollerRef, setIsUserInteraction])

  return (
    <AnimatePresence>
      {showKeepScrollingPanel && (
        <FloatPanel side="bottom">
          Already scrolled to the bottom.
          <br />
          Keep pressing to jump to the next article
        </FloatPanel>
      )}
    </AnimatePresence>
  )
}

const FloatPanel: React.FC<{ children: React.ReactNode; side: "bottom" | "top" }> = ({
  children,
  side,
}) => (
  <m.div
    initial={{ opacity: 0, y: 32 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 32 }}
    transition={{ duration: 0.2 }}
    className={cn(
      "bg-material-ultra-thick text-text backdrop-blur-background absolute left-1/2 z-50 -translate-x-1/2 select-none rounded-2xl px-6 py-3 text-center text-[15px] font-medium shadow-xl",
      side === "bottom" ? "bottom-8" : "top-8",
    )}
    style={{
      boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.08)",
      WebkitBackdropFilter: "blur(16px)",
      backdropFilter: "blur(16px)",
      maxWidth: 360,
      width: "calc(100vw - 32px)",
    }}
  >
    {children}
  </m.div>
)
