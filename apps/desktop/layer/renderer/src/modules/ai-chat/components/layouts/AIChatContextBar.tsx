import { Popover, PopoverContent, PopoverTrigger } from "@follow/components/ui/popover/index.jsx"
import { cn } from "@follow/utils/utils"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useDisplayBlocks } from "~/modules/ai-chat/hooks/useDisplayBlocks"
import { useFileUploadWithDefaults } from "~/modules/ai-chat/hooks/useFileUpload"
import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"
import { SUPPORTED_MIME_ACCEPT } from "~/modules/ai-chat/utils/file-validation"

import { useBlockActions } from "../../store/hooks"
import { BlockSliceAction } from "../../store/slices/block.slice"
import { CombinedContextBlock, ContextBlock } from "../context-bar/blocks"
import { MentionButton } from "../context-bar/MentionButton"

// Maximum number of context blocks to show before collapsing into "more" popover
const MAX_VISIBLE_BLOCKS = 4

export const AIChatContextBar: Component = memo(({ className }) => {
  const blocks = useAIChatStore()((s) => s.blocks)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { handleFileInputChange } = useFileUploadWithDefaults()

  const handleAttachFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const { addOrUpdateBlock, removeBlock } = useBlockActions()

  const view = useRouteParamsSelector((i) => {
    if (!i.isPendingEntry) return
    return i.view
  })
  const feedId = useRouteParamsSelector((i) => {
    if (i.isAllFeeds || !i.isPendingEntry) return
    return i.feedId
  })
  useEffect(() => {
    if (typeof view === "number") {
      addOrUpdateBlock({
        id: BlockSliceAction.SPECIAL_TYPES.mainView,
        type: "mainView",
        value: `${view}`,
      })
    } else {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.mainView)
    }

    return () => {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.mainView)
    }
  }, [addOrUpdateBlock, view, removeBlock])

  useEffect(() => {
    if (feedId) {
      addOrUpdateBlock({
        id: BlockSliceAction.SPECIAL_TYPES.mainFeed,
        type: "mainFeed",
        value: feedId,
      })
    } else {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.mainFeed)
    }
    return () => {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.mainFeed)
    }
  }, [addOrUpdateBlock, feedId, removeBlock])

  // Add unreadOnly context block only when unreadOnly is enabled
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  useEffect(() => {
    if (unreadOnly) {
      addOrUpdateBlock({
        id: BlockSliceAction.SPECIAL_TYPES.unreadOnly,
        type: "unreadOnly",
        value: "true",
      })
    } else {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.unreadOnly)
    }

    return () => {
      removeBlock(BlockSliceAction.SPECIAL_TYPES.unreadOnly)
    }
  }, [addOrUpdateBlock, unreadOnly, removeBlock])

  const displayBlocks = useDisplayBlocks(blocks)

  // Split blocks into visible and hidden based on MAX_VISIBLE_BLOCKS
  const { visibleBlocks, hiddenBlocks } = useMemo(() => {
    if (displayBlocks.length <= MAX_VISIBLE_BLOCKS) {
      return { visibleBlocks: displayBlocks, hiddenBlocks: [] }
    }
    return {
      visibleBlocks: displayBlocks.slice(0, MAX_VISIBLE_BLOCKS),
      hiddenBlocks: displayBlocks.slice(MAX_VISIBLE_BLOCKS),
    }
  }, [displayBlocks])

  const renderBlock = useCallback((item: (typeof displayBlocks)[number]) => {
    if (item.kind === "combined") {
      return (
        <CombinedContextBlock
          key={`combined-${item.viewBlock?.id}-${item.feedBlock?.id}-${item.unreadOnlyBlock?.id}`}
          viewBlock={item.viewBlock}
          feedBlock={item.feedBlock}
          unreadOnlyBlock={item.unreadOnlyBlock}
        />
      )
    }

    return <ContextBlock key={item.block.id} block={item.block} />
  }, [])

  return (
    <div className={cn("flex items-center gap-2 px-4 py-3", className)}>
      <MentionButton />

      {/* File Upload Button */}
      <button
        type="button"
        onClick={handleAttachFile}
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-material-medium text-text-secondary transition-colors hover:bg-material-thin hover:text-text-secondary"
        title="Upload Files"
      >
        <i className="i-mgc-attachment-cute-re size-3.5" />
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_MIME_ACCEPT}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Visible Context Blocks */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {visibleBlocks.map((item) => (
          <div
            key={
              item.kind === "combined"
                ? `combined-${item.viewBlock?.id}-${item.feedBlock?.id}-${item.unreadOnlyBlock?.id}`
                : item.block.id
            }
            className="max-w-[min(240px,100%)] shrink-0"
          >
            {renderBlock(item)}
          </div>
        ))}

        {/* More Button with Popover */}
        {hiddenBlocks.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-material-medium px-2.5 text-xs text-text-secondary transition-colors hover:bg-fill-secondary hover:text-text"
              >
                <i className="i-mgc-more-1-cute-re size-3.5" />
                <span>+{hiddenBlocks.length}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="flex flex-col gap-2">
                <div className="mb-1 text-xs font-medium text-text-secondary">
                  Additional Context
                </div>
                {hiddenBlocks.map((item) => renderBlock(item))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
})
AIChatContextBar.displayName = "AIChatContextBar"
