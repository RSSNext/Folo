import type { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import type { FeedModel } from "@follow/store/feed/types"
import { useIsInbox } from "@follow/store/inbox/hooks"
import { thenable } from "@follow/utils"
import { stopPropagation } from "@follow/utils/dom"
import { clsx } from "@follow/utils/utils"
import { ErrorBoundary } from "@sentry/react"
import * as React from "react"
import { memo } from "react"

import { useEntryIsInReadability } from "~/atoms/readability"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { EntryContentHTMLRenderer } from "~/modules/renderer/html"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"

import { EntryContentFallback } from "./components/entry-content/EntryContentFallback"
import { EntryContentLoading } from "./components/entry-content/EntryContentLoading"
import { EntryNoContent } from "./components/entry-content/EntryNoContent"
import { EntryRenderError } from "./components/entry-content/EntryRenderError"
import type { EntryContentProps } from "./components/entry-content/types"
import { EntryAttachments } from "./components/EntryAttachments"
import { EntryTitle } from "./components/EntryTitle"
import { useEntryContent, useEntryMediaInfo } from "./hooks"

const EntryContentImpl: Component<EntryContentProps> = ({
  entryId,
  noMedia,

  compact,
}) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, inboxHandle } = state
    const { title, url } = state

    return { feedId, inboxId: inboxHandle, title, url }
  })
  if (!entry) throw thenable

  const feed = useFeedById(entry?.feedId)

  const isInbox = useIsInbox(entry?.inboxId)
  const isInReadabilityMode = useEntryIsInReadability(entryId)

  const { error, content, isPending } = useEntryContent(entryId)

  const view = useRouteParamsSelector((route) => route.view)

  return (
    <div className="relative flex size-full flex-col overflow-hidden @container print:size-auto print:overflow-visible">
      <article
        onContextMenu={stopPropagation}
        className={clsx("relative m-auto min-w-0 select-text", "w-full max-w-full")}
      >
        <EntryTitle entryId={entryId} compact={compact} noRecentReader />

        <WrappedElementProvider boundingDetection>
          <div className="mx-auto my-8 max-w-full cursor-auto">
            <ErrorBoundary fallback={EntryRenderError}>
              <ShadowDOM injectHostStyles={!isInbox}>
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

        {!content && !isInReadabilityMode && (
          <div className="center mt-16 min-w-0">
            {isPending ? (
              <EntryContentLoading icon={!isInbox ? (feed as FeedModel)?.siteUrl : undefined} />
            ) : error ? (
              <div className="center mt-36 flex flex-col items-center gap-3">
                <i className="i-mgc-warning-cute-re text-4xl text-red" />
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
      </article>
    </div>
  )
}
export const EntryContentForPreview: Component<EntryContentProps> = memo((props) => {
  return (
    <EntryContentFallback entryId={props.entryId}>
      <EntryContentImpl {...props} />
    </EntryContentFallback>
  )
})

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

  return (
    <EntryContentHTMLRenderer
      view={view}
      feedId={feedId}
      entryId={entryId}
      mediaInfo={mediaInfo}
      noMedia={noMedia}
      as="article"
      className="prose !max-w-full hyphens-auto dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold"
      style={stableRenderStyle}
      renderInlineStyle={readerRenderInlineStyle}
    >
      {content}
    </EntryContentHTMLRenderer>
  )
})
