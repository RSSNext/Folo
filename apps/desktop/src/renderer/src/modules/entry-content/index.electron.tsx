import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { useTitle } from "@follow/hooks"
import type { FeedModel, InboxModel } from "@follow/models/types"
import { IN_ELECTRON } from "@follow/shared/constants"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import * as React from "react"
import { useEffect, useMemo, useRef } from "react"

import { useEntryIsInReadability } from "~/atoms/readability"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import { useInPeekModal } from "~/components/ui/modal/inspire/PeekModal"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery } from "~/hooks/common"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"
import { Queries } from "~/queries"
import { useEntryTranslation } from "~/store/ai/hook"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { EntryContentHTMLRenderer } from "../renderer/html"
import { EntryTimelineSidebar } from "./components/EntryTimelineSidebar"
import { EntryTitle } from "./components/EntryTitle"
import { SourceContentPanel } from "./components/SourceContentView"
import { SupportCreator } from "./components/SupportCreator"
import { EntryHeader } from "./header"
import { useFocusEntryContainerSubscriptions } from "./hooks"
import type { EntryContentProps } from "./index.shared"
import {
  AISummary,
  ContainerToc,
  NoContent,
  ReadabilityAutoToggleEffect,
  ReadabilityContent,
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
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const inbox = useInboxById(entry?.inboxId, (inbox) => inbox !== null)

  const { error, data, isPending } = useAuthQuery(
    inbox ? Queries.entries.byInboxId(entryId) : Queries.entries.byId(entryId),
    {
      staleTime: 300_000,
    },
  )

  const readerFontFamily = useUISettingKey("readerFontFamily")
  const view = useRouteParamsSelector((route) => route.view)

  const isInReadabilityMode = useEntryIsInReadability(entryId)
  const scrollerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollerRef.current?.scrollTo(0, 0)
    scrollerRef.current?.focus()
  }, [entryId])

  const isPeekModal = useInPeekModal()

  const contentAccessories = useMemo(
    () => (isPeekModal ? undefined : <ContainerToc key={entryId} />),
    [entryId, isPeekModal],
  )
  useFocusEntryContainerSubscriptions(scrollerRef)
  const contentLineHeight = useUISettingKey("contentLineHeight")
  const contentFontSize = useUISettingKey("contentFontSize")

  const stableRenderStyle = useMemo(() => {
    const css = {} as React.CSSProperties
    if (readerFontFamily) {
      css.fontFamily = readerFontFamily
    }
    if (contentLineHeight) {
      css.lineHeight = contentLineHeight
    }
    if (contentFontSize) {
      css.fontSize = contentFontSize
    }

    return css
  }, [readerFontFamily, contentLineHeight, contentFontSize])
  const mediaInfo = useMemo(
    () =>
      Object.fromEntries(
        (entry?.entries.media ?? data?.entries.media)
          ?.filter((m) => m.type === "photo")
          .map((cur) => [
            cur.url,
            {
              width: cur.width,
              height: cur.height,
            },
          ]) ?? [],
      ),
    [entry?.entries.media, data?.entries.media],
  )
  const customCSS = useUISettingKey("customCSS")

  const contentTranslated = useEntryTranslation({ entry, extraFields: ["content"] })

  const isInPeekModal = useInPeekModal()

  if (!entry) return null

  const entryContent = entry?.entries.content ?? data?.entries.content
  const translatedContent = contentTranslated.data?.content
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
          <div
            style={stableRenderStyle}
            className="animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:fade-in-0 f-motion-reduce:slide-in-from-bottom-0 select-text duration-200 ease-in-out"
            key={entry.entries.id}
          >
            <article
              data-testid="entry-render"
              onContextMenu={stopPropagation}
              className="@[47.5rem]:max-w-[70ch] @7xl:max-w-[80ch] relative m-auto min-w-0 max-w-[550px]"
            >
              <EntryTitle entryId={entryId} compact={compact} />

              <WrappedElementProvider boundingDetection>
                <div className="mx-auto mb-32 mt-8 max-w-full cursor-auto text-[0.94rem]">
                  <TitleMetaHandler entryId={entry.entries.id} />
                  <AISummary entryId={entry.entries.id} />
                  <ErrorBoundary fallback={RenderError}>
                    {!isInReadabilityMode ? (
                      <ShadowDOM injectHostStyles={!isInbox}>
                        {!!customCSS && (
                          <MemoedDangerousHTMLStyle>{customCSS}</MemoedDangerousHTMLStyle>
                        )}
                        <EntryContentHTMLRenderer
                          view={view}
                          feedId={feed?.id}
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
                      </ShadowDOM>
                    ) : (
                      <ReadabilityContent entryId={entryId} feedId={feed.id} />
                    )}
                  </ErrorBoundary>
                </div>
              </WrappedElementProvider>

              {entry.settings?.readability && IN_ELECTRON && (
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
                    <div className="center flex min-w-0 flex-col gap-2">
                      <i className="i-mgc-close-cute-re text-3xl text-red-500" />
                      <span className="font-sans text-sm">Network Error</span>

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
        </ScrollArea.ScrollArea>
        <SourceContentPanel src={entry.entries.url} />
      </div>
    </>
  )
}
