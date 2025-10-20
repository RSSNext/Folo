import { cn } from "@follow/utils/utils"
import { memo, useCallback, useEffect, useRef } from "react"

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

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-4 py-3", className)}>
      <MentionButton />

      {/* File Upload Button */}
      <button
        type="button"
        onClick={handleAttachFile}
        className="bg-material-medium hover:bg-material-thin border-border text-text-secondary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
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

      {/* Context Blocks */}
      {displayBlocks.map((item) => {
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
      })}
    </div>
  )
})
AIChatContextBar.displayName = "AIChatContextBar"
