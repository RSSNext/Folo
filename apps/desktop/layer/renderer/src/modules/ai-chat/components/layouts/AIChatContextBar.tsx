import { cn } from "@follow/utils/utils"
import { memo, useCallback, useMemo, useRef } from "react"

import { useAISettingValue } from "~/atoms/settings/ai"
import { DropdownMenu, DropdownMenuTrigger } from "~/components/ui/dropdown-menu/dropdown-menu"
import { useFileUploadWithDefaults } from "~/modules/ai-chat/hooks/useFileUpload"
import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"
import { SUPPORTED_MIME_ACCEPT } from "~/modules/ai-chat/utils/file-validation"

import { ContextBlock } from "../context-bar/blocks"
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

    return (
      <div className={cn("flex flex-wrap items-center gap-2 px-4 py-3", className)}>
        {/* Add Context Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="bg-fill-secondary hover:bg-fill-tertiary border-border text-text-tertiary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
            >
              <i className="i-mgc-add-cute-re size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <ContextMenuContent />
        </DropdownMenu>

        {/* File Upload Button */}
        <button
          type="button"
          onClick={handleAttachFile}
          className="bg-fill-secondary hover:bg-fill-tertiary border-border text-text-tertiary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
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
                className="bg-fill-secondary hover:bg-fill-tertiary border-border text-text-tertiary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
                title="AI Shortcuts"
              >
                <i className="i-mgc-magic-2-cute-re size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <ShortcutsMenuContent shortcuts={shortcuts} onSendShortcut={onSendShortcut} />
          </DropdownMenu>
        )}

        {/* Context Blocks */}
        {blocks.map((block) => (
          <ContextBlock key={block.id} block={block} />
        ))}
      </div>
    )
  },
)
AIChatContextBar.displayName = "AIChatContextBar"
