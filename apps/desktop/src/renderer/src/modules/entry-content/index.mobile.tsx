import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { ScrollElementContext } from "@follow/components/ui/scroll-area/ctx.js"
import { useTitle } from "@follow/hooks"
import type { FeedModel, InboxModel } from "@follow/models/types"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import { useEffect, useMemo, useState } from "react"

import { useAudioPlayerAtomSelector } from "~/atoms/player"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery, usePreventOverscrollBounce } from "~/hooks/common"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"
import { Queries } from "~/queries"
import { useEntryTranslation } from "~/store/ai/hook"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { CornerPlayer } from "../player/corner-player"
import { EntryContentHTMLRenderer } from "../renderer/html"
import { AISummary } from "./AISummary"
import { EntryReadHistory } from "./components/EntryReadHistory"
import { EntryTitle } from "./components/EntryTitle"
import { SupportCreator } from "./components/SupportCreator"
import { EntryHeader } from "./header"
import { NoContent, RenderError, TitleMetaHandler } from "./index.shared"
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

  const contentTranslated = useEntryTranslation({ entry, extraFields: ["content"] })

  const contentLineHeight = useUISettingKey("contentLineHeight")
  const contentFontSize = useUISettingKey("contentFontSize")

  const stableRenderStyle = useMemo(() => {
    const css = {} as React.CSSProperties

    if (contentLineHeight) {
      css.lineHeight = contentLineHeight
    }
    if (contentFontSize) {
      css.fontSize = contentFontSize
    }

    return css
  }, [contentLineHeight, contentFontSize])

  if (!entry) return null

  const entryContent = entry?.entries.content ?? data?.entries.content
  const translatedContent = contentTranslated.data?.content
  const content = translatedContent || entryContent

  const isInbox = !!inbox

  return (
    <WrappedElementProvider>
      <ScrollElementContext.Provider value={scrollElement}>
        <div className="flex h-screen flex-col">
          <EntryHeader
            entryId={entry.entries.id}
            view={view}
            className={cn(
              "bg-background @container sticky top-0 z-[12] h-[55px] shrink-0 px-3",
              classNames?.header,
            )}
            compact={compact}
          />
          <div
            className="@container relative flex h-0 min-w-0 grow flex-col overflow-y-auto overflow-x-hidden px-4 pt-12 print:!size-auto print:!overflow-visible"
            ref={setScrollElement}
          >
            {!hideRecentReader && (
              <div
                className={cn(
                  "text-body absolute top-0 my-2 -mt-8 flex items-center gap-2 leading-none text-zinc-500",
                  "visible z-[11]",
                )}
              >
                <EntryReadHistory entryId={entryId} />
              </div>
            )}

            <div
              className="animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:fade-in-0 f-motion-reduce:slide-in-from-bottom-0 duration-200 ease-in-out"
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
                          mediaInfo={mediaInfo}
                          noMedia={noMedia}
                          as="article"
                          className="prose dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold !max-w-full hyphens-auto"
                          renderInlineStyle={readerRenderInlineStyle}
                          style={stableRenderStyle}
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
          </div>
        </div>
      </ScrollElementContext.Provider>
    </WrappedElementProvider>
  )
}
