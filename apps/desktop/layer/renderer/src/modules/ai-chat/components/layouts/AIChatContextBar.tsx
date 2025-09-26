import { cn } from "@follow/utils/utils"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"

import { useAISettingValue } from "~/atoms/settings/ai"
import { DropdownMenu, DropdownMenuTrigger } from "~/components/ui/dropdown-menu/dropdown-menu"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useDisplayBlocks } from "~/modules/ai-chat/hooks/useDisplayBlocks"
import { useFileUploadWithDefaults } from "~/modules/ai-chat/hooks/useFileUpload"
import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"
import { SUPPORTED_MIME_ACCEPT } from "~/modules/ai-chat/utils/file-validation"

import { useBlockActions } from "../../store/hooks"
import { BlockSliceAction } from "../../store/slices/block.slice"
import { ContextBlock, MainViewFeedContextBlock } from "../context-bar/blocks"
import { ContextMenuContent, ShortcutsMenuContent } from "../context-bar/menus"

export const AIChatContextBar: Component<{ onSendShortcut?: (prompt: string) => void }> = memo(
  ({ className, onSendShortcut }) => {
    const blocks = useAIChatStore()((s) => s.blocks)
    const { shortcuts } = useAISettingValue()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { handleFileInputChange } = useFileUploadWithDefaults()

    // Filter enabled shortcuts
    const enabledShortcuts = useMemo(
      () => shortcuts.filter((shortcut) => shortcut.enabled),
      [shortcuts],
    )

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

    const displayBlocks = useDisplayBlocks(blocks)

    return (
      <div className={cn("flex flex-wrap items-center gap-2 px-4 py-3", className)}>
        {/* Add Context Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="bg-material-medium hover:bg-material-thin border-border text-text-secondary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
            >
              <i className="i-mgc-at-cute-re size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <ContextMenuContent />
        </DropdownMenu>

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

        {/* AI Shortcuts Button */}
        {enabledShortcuts.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="bg-material-medium hover:bg-material-thin border-border text-text-secondary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
                title="AI Shortcuts"
              >
                <i className="i-mgc-magic-2-cute-re size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <ShortcutsMenuContent shortcuts={shortcuts} onSendShortcut={onSendShortcut} />
          </DropdownMenu>
        )}

        {/* Context Blocks */}
        {displayBlocks.map((item) => {
          if (item.kind === "combined") {
            return (
              <MainViewFeedContextBlock
                key={item.viewBlock.id}
                viewBlock={item.viewBlock}
                feedBlock={item.feedBlock}
              />
            )
          }

          return <ContextBlock key={item.block.id} block={item.block} />
        })}
      </div>
    )
  },
)
AIChatContextBar.displayName = "AIChatContextBar"
