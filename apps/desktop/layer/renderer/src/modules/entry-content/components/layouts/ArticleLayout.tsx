import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsInbox } from "@follow/store/inbox/hooks"
import { cn } from "@follow/utils"
import { ErrorBoundary } from "@sentry/react"
import { useCallback, useMemo, useRef } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"
import { ShadowDOM } from "~/components/common/ShadowDOM"
import type { TocRef } from "~/components/ui/markdown/components/Toc"
import { useInPeekModal } from "~/components/ui/modal/inspire/InPeekModal"
import { readableContentMaxWidthClassName } from "~/constants/ui"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import type { TextSelectionEvent } from "~/lib/simple-text-selection"
import { useBlockActions } from "~/modules/ai-chat/store/hooks"
import { BlockSliceAction } from "~/modules/ai-chat/store/slices/block.slice"
import { EntryContentHTMLRenderer } from "~/modules/renderer/html"
import { WrappedElementProvider } from "~/providers/wrapped-element-provider"

import { AISummary } from "../../AISummary"
import { useEntryContent, useEntryMediaInfo } from "../../hooks"
import { EntryContentAccessories } from "../entry-content/accessories"
import { EntryRenderError } from "../entry-content/EntryRenderError"
import { EntryTitleMetaHandler } from "../entry-content/EntryTitleMetaHandler"
import { ReadabilityNotice } from "../entry-content/ReadabilityNotice"
import { EntryAttachments } from "../EntryAttachments"
import { EntryTitle } from "../EntryTitle"
import { SupportCreator } from "../SupportCreator"

interface ArticleLayoutProps {
  entryId: string
  compact?: boolean
  noMedia?: boolean
  translation?: {
    content?: string
    title?: string
  }
}

export const ArticleLayout: React.FC<ArticleLayoutProps> = ({
  entryId,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => ({
    feedId: state.feedId,
    inboxId: state.inboxHandle,
  }))
  const feed = useFeedById(entry?.feedId)
  const isInbox = useIsInbox(entry?.inboxId)

  const { content } = useEntryContent(entryId)
  const customCSS = useUISettingKey("customCSS")

  const { addOrUpdateBlock, removeBlock } = useBlockActions()
  const handleTextSelect = useCallback(
    (event: TextSelectionEvent) => {
      addOrUpdateBlock({
        id: BlockSliceAction.SPECIAL_TYPES.selectedText,
        type: "selectedText",
        value: event.selectedText,
      })
    },
    [addOrUpdateBlock],
  )
  const handleSelectionClear = useCallback(() => {
    removeBlock(BlockSliceAction.SPECIAL_TYPES.selectedText)
  }, [removeBlock])
  if (!entry) return null

  return (
    <div className={cn(readableContentMaxWidthClassName, "mx-auto")}>
      <EntryTitle entryId={entryId} compact={compact} />

      <WrappedElementProvider boundingDetection>
        <div className="mx-auto mb-32 mt-8 max-w-full cursor-auto text-[0.94rem]">
          <EntryTitleMetaHandler entryId={entryId} />
          <AISummary entryId={entryId} />
          <ErrorBoundary fallback={EntryRenderError}>
            <ReadabilityNotice entryId={entryId} />
            <ShadowDOM
              injectHostStyles={!isInbox}
              textSelectionEnabled
              onTextSelect={handleTextSelect}
              onSelectionClear={handleSelectionClear}
            >
              {!!customCSS && <MemoedDangerousHTMLStyle>{customCSS}</MemoedDangerousHTMLStyle>}

              <Renderer
                entryId={entryId}
                view={FeedViewType.Articles}
                feedId={feed?.id || ""}
                noMedia={noMedia}
                content={content}
                translation={translation}
              />
            </ShadowDOM>
          </ErrorBoundary>
        </div>
      </WrappedElementProvider>

      <EntryAttachments entryId={entryId} />
      <SupportCreator entryId={entryId} />
    </div>
  )
}

const Renderer: React.FC<{
  entryId: string
  view: FeedViewType
  feedId: string
  noMedia?: boolean
  content?: Nullable<string>
  translation?: {
    content?: string
    title?: string
  }
  onTextSelect?: (event: TextSelectionEvent) => void
  onSelectionClear?: (entryId: string) => void
  textSelectionEnabled?: boolean
}> = ({ entryId, view, feedId, noMedia = false, content = "", translation }) => {
  const mediaInfo = useEntryMediaInfo(entryId)
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const stableRenderStyle = useRenderStyle()
  const isInPeekModal = useInPeekModal()

  const tocRef = useRef<TocRef | null>(null)
  const contentAccessories = useMemo(
    () => (isInPeekModal ? undefined : <EntryContentAccessories ref={{ tocRef }} />),
    [isInPeekModal],
  )

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
      {translation?.content || content}
    </EntryContentHTMLRenderer>
  )
}
