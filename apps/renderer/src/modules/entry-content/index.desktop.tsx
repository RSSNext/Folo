import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { useTitle } from "@follow/hooks"
import type { FeedModel, InboxModel, SupportedLanguages } from "@follow/models/types"
import { IN_ELECTRON } from "@follow/shared/constants"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import { useEffect, useMemo, useRef } from "react"

import { useShowAITranslation } from "~/atoms/ai-translation"
import { useEntryIsInReadability } from "~/atoms/readability"
import { useGeneralSettingSelector } from "~/atoms/settings/general"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import { useInPeekModal } from "~/components/ui/modal/inspire/PeekModal"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery } from "~/hooks/common"
import { checkLanguage } from "~/lib/translate"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"
import { Queries } from "~/queries"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { EntryContentHTMLRenderer } from "../renderer/html"
import { getTranslationCache, setTranslationCache } from "./atoms"
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
  const stableRenderStyle = useMemo(
    () =>
      readerFontFamily
        ? {
            fontFamily: readerFontFamily,
          }
        : undefined,
    [readerFontFamily],
  )
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
  const showAITranslation = useShowAITranslation()
  const translationLanguage = useGeneralSettingSelector(
    (s) => s.translationLanguage,
  ) as SupportedLanguages

  if (!entry) return null

  const content = entry?.entries.content ?? data?.entries.content

  const translate = async (html: HTMLElement | null) => {
    if (!html || !entry) return

    const fullText = html.textContent ?? ""
    if (!fullText) return

    const translation =
      entry.settings?.translation ?? (showAITranslation ? translationLanguage : undefined)

    if (translation) {
      const isLanguageMatch = checkLanguage({
        content: fullText,
        language: translation,
      })
      if (isLanguageMatch) {
        return
      }
    }

    const { immersiveTranslate } = await import("~/lib/immersive-translate")
    immersiveTranslate({
      html,
      entry,
      targetLanguage: translation as SupportedLanguages,
      cache: {
        get: (key: string) => getTranslationCache()[key],
        set: (key: string, value: string) =>
          setTranslationCache({ ...getTranslationCache(), [key]: value }),
      },
    })
  }

  const isInbox = !!inbox

  return (
    <>
      <EntryHeader
        entryId={entry.entries.id}
        view={view}
        className={cn("h-[55px] shrink-0 px-3 @container", classNames?.header)}
        compact={compact}
      />

      <div className="relative flex size-full flex-col overflow-hidden @container print:size-auto print:overflow-visible">
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
            className="select-text duration-200 ease-in-out animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:fade-in-0 f-motion-reduce:slide-in-from-bottom-0"
            key={entry.entries.id}
          >
            <article
              data-testid="entry-render"
              onContextMenu={stopPropagation}
              className="relative m-auto min-w-0 max-w-[550px] @[47.5rem]:max-w-[70ch] @7xl:max-w-[80ch]"
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
                          handleTranslate={translate}
                          mediaInfo={mediaInfo}
                          noMedia={noMedia}
                          accessory={contentAccessories}
                          as="article"
                          className="prose !max-w-full hyphens-auto dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold"
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
                      icon={!isInbox ? (feed as FeedModel)?.siteUrl! : undefined}
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
