import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.js"
import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsInbox } from "@follow/store/inbox/hooks"
import { cn } from "@follow/utils"
import { ErrorBoundary } from "@sentry/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AIChatPanelStyle, useAIChatPanelStyle, useAIPanelVisibility } from "~/atoms/settings/ai"
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

import { useEntryContent, useEntryMediaInfo } from "../../hooks"
import { AISummary } from "../AISummary"
import { ContainerToc } from "../entry-content/accessories/ContainerToc"
import { EntryRenderError } from "../entry-content/EntryRenderError"
import { ReadabilityNotice } from "../entry-content/ReadabilityNotice"
import { EntryAttachments } from "../EntryAttachments"
import { EntryTitle } from "../EntryTitle"
import { MediaTranscript, TranscriptToggle, useTranscription } from "./shared"
import { ArticleAudioPlayer } from "./shared/AudioPlayer"
import type { EntryLayoutProps } from "./types"

export const ArticleLayout: React.FC<EntryLayoutProps> = ({
  entryId,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => ({
    feedId: state.feedId,
    inboxId: state.inboxHandle,
  }))
  const { data: transcriptionData } = useTranscription(entryId)

  const feed = useFeedById(entry?.feedId)
  const isInbox = useIsInbox(entry?.inboxId)
  const [showTranscript, setShowTranscript] = useState(false)

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

  const aiChatPanelStyle = useAIChatPanelStyle()
  const isAIPanelVisible = useAIPanelVisibility()

  const shouldShowAISummary = aiChatPanelStyle === AIChatPanelStyle.Floating || !isAIPanelVisible
  if (!entry) return null

  return (
    <div className={cn(readableContentMaxWidthClassName, "mx-auto mt-1 px-4")}>
      <EntryTitle entryId={entryId} compact={compact} containerClassName="mt-12" />

      <ArticleAudioPlayer entryId={entryId} />

      {/* Content Type Toggle */}
      <TranscriptToggle
        showTranscript={showTranscript}
        onToggle={setShowTranscript}
        hasTranscript={!!transcriptionData}
      />

      <WrappedElementProvider boundingDetection>
        <div className="mx-auto mb-32 mt-6 max-w-full cursor-auto text-[0.94rem]">
          {shouldShowAISummary && <AISummary entryId={entryId} />}
          <ErrorBoundary fallback={EntryRenderError}>
            <ReadabilityNotice entryId={entryId} />
            {showTranscript ? (
              <MediaTranscript
                className="prose !max-w-full dark:prose-invert"
                srt={transcriptionData}
                entryId={entryId}
                type="transcription"
              />
            ) : (
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
            )}
          </ErrorBoundary>
        </div>
      </WrappedElementProvider>

      <EntryAttachments entryId={entryId} />
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
    () => (isInPeekModal ? undefined : <ContainerToc ref={tocRef} stickyClassName="top-48" />),
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
      className="autospace-normal prose !max-w-full hyphens-auto dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold"
      style={stableRenderStyle}
      renderInlineStyle={readerRenderInlineStyle}
    >
      {translation?.content || content}
    </EntryContentHTMLRenderer>
  )
}
