import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { ScrollElementContext } from "@follow/components/ui/scroll-area/ctx.js"
import { useTitle } from "@follow/hooks"
import type { FeedModel, InboxModel, SupportedLanguages } from "@follow/models/types"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import { useEffect, useMemo, useState } from "react"

import { useShowAITranslation } from "~/atoms/ai-translation"
import { useAudioPlayerAtomSelector } from "~/atoms/player"
import { useGeneralSettingSelector } from "~/atoms/settings/general"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery, usePreventOverscrollBounce } from "~/hooks/common"
import { checkLanguage } from "~/lib/translate"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"
import { Queries } from "~/queries"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { CornerPlayer } from "../player/corner-player"
import { EntryContentHTMLRenderer } from "../renderer/html"
import { getTranslationCache, setTranslationCache } from "./atoms"
import { EntryReadHistory } from "./components/EntryReadHistory"
import { EntryTitle } from "./components/EntryTitle"
import { SupportCreator } from "./components/SupportCreator"
import { EntryHeader } from "./header"
import { AISummary, NoContent, RenderError, TitleMetaHandler } from "./index.shared"
import { EntryContentLoading } from "./loading"

export interface EntryContentClassNames {
  header?: string
}

export const EntryContent: Component<{
  entryId: string
  noMedia?: boolean
  compact?: boolean
  classNames?: EntryContentClassNames
}> = ({ entryId, noMedia, compact, classNames }) => {
  const navigateEntry = useNavigateEntry()
  const { entryId: _, ...params } = useRouteParamsSelector((route) => route)

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      nextFrame(() => {
        // This is triggered when the back button is pressed
        navigateEntry({ entryId: null, ...params })
      })
    }

    // Listen to the popstate event (back button)
    window.addEventListener("popstate", handlePopState)

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [navigateEntry, params])

  const entry = useEntry(entryId)
  useTitle(entry?.entries.title)

  const feed = useFeedById(entry?.feedId) as FeedModel | InboxModel
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const inbox = useInboxById(entry?.inboxId, (inbox) => inbox !== null)

  const { error, data, isPending } = useAuthQuery(
    inbox ? Queries.entries.byInboxId(entryId) : Queries.entries.byId(entryId),
    {
      enabled: !!entryId,
      staleTime: 300_000,
    },
  )

  const view = useRouteParamsSelector((route) => route.view)

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
  const hideRecentReader = useUISettingKey("hideRecentReader")

  const { entryId: audioEntryId } = useAudioPlayerAtomSelector((state) => state)

  usePreventOverscrollBounce()
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

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
    <WrappedElementProvider>
      <ScrollElementContext.Provider value={scrollElement}>
        <div className="flex h-screen flex-col">
          <EntryHeader
            entryId={entry.entries.id}
            view={view}
            className={cn(
              "sticky top-0 z-[12] h-[55px] shrink-0 bg-background px-3 @container",
              classNames?.header,
            )}
            compact={compact}
          />
          <div
            className="relative flex h-0 min-w-0 grow flex-col overflow-y-auto overflow-x-hidden px-4 pt-12 @container print:!size-auto print:!overflow-visible"
            ref={setScrollElement}
          >
            {!hideRecentReader && (
              <div
                className={cn(
                  "absolute top-0 my-2 -mt-8 flex items-center gap-2 text-[13px] leading-none text-zinc-500",
                  "visible z-[11]",
                )}
              >
                <EntryReadHistory entryId={entryId} />
              </div>
            )}

            <div
              className="duration-200 ease-in-out animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:fade-in-0 f-motion-reduce:slide-in-from-bottom-0"
              key={entry.entries.id}
            >
              <article
                onContextMenu={stopPropagation}
                className="relative m-auto min-w-0 max-w-[550px]"
              >
                <EntryTitle entryId={entryId} compact={compact} />

                {audioEntryId === entryId && (
                  <CornerPlayer className="mx-auto !mt-4 w-full overflow-hidden rounded-md md:w-[350px]" />
                )}

                <WrappedElementProvider boundingDetection>
                  <div className="mx-auto mb-32 mt-8 max-w-full cursor-auto select-text text-[0.94rem]">
                    <TitleMetaHandler entryId={entry.entries.id} />
                    <AISummary entryId={entry.entries.id} />
                    <ErrorBoundary fallback={RenderError}>
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
                          as="article"
                          className="prose !max-w-full hyphens-auto dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold"
                          renderInlineStyle={readerRenderInlineStyle}
                        >
                          {content}
                        </EntryContentHTMLRenderer>
                      </ShadowDOM>
                    </ErrorBoundary>
                  </div>
                </WrappedElementProvider>

                {!content && (
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
          </div>
        </div>
      </ScrollElementContext.Provider>
    </WrappedElementProvider>
  )
}
