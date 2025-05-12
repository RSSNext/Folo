import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import type { FeedViewType } from "@follow/constants"
import { useTitle } from "@follow/hooks"
import type { FeedModel, InboxModel } from "@follow/models/types"
import { stopPropagation } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { springScrollTo } from "@follow/utils/scroller"
import { cn } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import * as React from "react"
import { useEffect, useMemo, useRef } from "react"

import {
  useEntryIsInReadability,
  useEntryIsInReadabilitySuccess,
  useEntryReadabilityContent,
} from "~/atoms/readability"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import type { TocRef } from "~/components/ui/markdown/components/Toc"
import { useInPeekModal } from "~/components/ui/modal/inspire/InPeekModal"
import { HotkeyScope } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery, useConditionalHotkeyScope } from "~/hooks/common"
import { useFeedSafeUrl } from "~/hooks/common/useFeedSafeUrl"
import { useHotkeyScope } from "~/providers/hotkey-provider"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"
import { Queries } from "~/queries"
import { useEntryTranslation } from "~/store/ai/hook"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { COMMAND_ID } from "../command/commands/id"
import { useCommandHotkey } from "../command/hooks/use-register-hotkey"
import { EntryContentHTMLRenderer } from "../renderer/html"
import { AISummary } from "./AISummary"
import { EntryTimelineSidebar } from "./components/EntryTimelineSidebar"
import { EntryTitle } from "./components/EntryTitle"
import { SourceContentPanel } from "./components/SourceContentView"
import { SupportCreator } from "./components/SupportCreator"
import { EntryHeader } from "./header"
import { useFocusEntryContainerSubscriptions } from "./hooks"
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

  const { error, data, isPending } = useAuthQuery(
    inbox ? Queries.entries.byInboxId(entryId) : Queries.entries.byId(entryId),
    {
      staleTime: 300_000,
    },
  )
  const readabilityContent = useEntryReadabilityContent(entryId)

  const view = useRouteParamsSelector((route) => route.view)

  const isInReadabilityMode = useEntryIsInReadability(entryId)
  const isReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    scrollerRef.current?.scrollTo(0, 0)
    scrollerRef.current?.focus()
  }, [entryId])

  useFocusEntryContainerSubscriptions(scrollerRef)

  const safeUrl = useFeedSafeUrl(entryId)

  const customCSS = useUISettingKey("customCSS")

  const contentTranslated = useEntryTranslation({
    entry,
    extraFields: isReadabilitySuccess ? ["readabilityContent"] : ["content"],
  })

  const isInPeekModal = useInPeekModal()

  const { setIsUserInteraction } = useRegisterCommands({
    entryId,
    scrollerRef,
  })

  if (!entry) return null

  const entryContent = isInReadabilityMode
    ? readabilityContent?.content
    : (entry?.entries.content ?? data?.entries.content)
  const translatedContent = isInReadabilityMode
    ? contentTranslated.data?.readabilityContent
    : contentTranslated.data?.content
  const content = translatedContent || entryContent

  const isInbox = !!inbox

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

      <div className="@container relative flex size-full flex-col overflow-hidden print:size-auto print:overflow-visible">
        <EntryTimelineSidebar entryId={entry.entries.id} />
        <EntryScrollArea className={className} scrollerRef={scrollerRef}>
          <div
            className="animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:fade-in-0 f-motion-reduce:slide-in-from-bottom-0 select-text duration-200 ease-in-out"
            key={entry.entries.id}
          >
            <article
              tabIndex={-1}
              onClick={() => setIsUserInteraction(true)}
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
          </div>
        </EntryScrollArea>
        <SourceContentPanel src={safeUrl ?? "#"} />
      </div>
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
  const mediaInfo = useEntry(entryId, (entry) =>
    Object.fromEntries(
      entry?.entries.media
        ?.filter((m) => m.type === "photo")
        .map((cur) => [
          cur.url,
          {
            width: cur.width,
            height: cur.height,
          },
        ]) ?? [],
    ),
  )

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

const useRegisterCommands = ({
  entryId,
  scrollerRef,
}: {
  entryId: string
  scrollerRef: React.RefObject<HTMLDivElement | null>
}) => {
  const [isUserInteraction, setIsUserInteraction] = React.useState(false)
  useConditionalHotkeyScope(HotkeyScope.EntryRender, isUserInteraction, true)

  const activeScope = useHotkeyScope()
  const when = activeScope.includes(HotkeyScope.EntryRender)

  useCommandHotkey({
    shortcut: shortcuts.entry.scrollUp.key,
    commandId: COMMAND_ID.entryRender.scrollUp,
    when,
  })

  useCommandHotkey({
    shortcut: shortcuts.entry.scrollDown.key,
    commandId: COMMAND_ID.entryRender.scrollDown,
    when,
  })

  useCommandHotkey({
    shortcut: shortcuts.entry.nextEntry.key,
    commandId: COMMAND_ID.timeline.switchToNext,

    when,
  })

  useCommandHotkey({
    shortcut: shortcuts.entry.previousEntry.key,
    commandId: COMMAND_ID.timeline.switchToPrevious,
    when,
  })

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.entryRender.scrollUp, () => {
      const currentScroll = scrollerRef.current?.scrollTop
      const delta = window.innerHeight

      if (typeof currentScroll === "number" && delta) {
        springScrollTo(currentScroll - delta, scrollerRef.current!)
      }
    })
  }, [scrollerRef])

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.entryRender.scrollDown, () => {
      const currentScroll = scrollerRef.current?.scrollTop
      const delta = window.innerHeight
      if (typeof currentScroll === "number" && delta) {
        springScrollTo(currentScroll + delta, scrollerRef.current!)
      }
    })
  }, [scrollerRef])

  useEffect(() => {
    return () => setIsUserInteraction(false)
  }, [entryId])

  return {
    setIsUserInteraction,
  }
}
