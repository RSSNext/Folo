import { ActionButton } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils/utils"
import { memo, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"

import { useAISettingValue } from "~/atoms/settings/ai"
import { DropdownMenu, DropdownMenuTrigger } from "~/components/ui/dropdown-menu/dropdown-menu"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useFileUploadWithDefaults } from "~/modules/ai-chat/hooks/useFileUpload"
import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"
import { SUPPORTED_MIME_ACCEPT } from "~/modules/ai-chat/utils/file-validation"
import { useCanCreateNewAITask } from "~/modules/ai-task/query"

import { AITaskModal } from "../../../ai-task/components/ai-task-modal"
import { ContextBlock } from "../context-bar/blocks"
import { ContextMenuContent, ShortcutsMenuContent } from "../context-bar/menus"

export const AIChatContextBar: Component<{ onSendShortcut?: (prompt: string) => void }> = memo(
  ({ className, onSendShortcut }) => {
    const blocks = useAIChatStore()((s) => s.blocks)
    const { shortcuts } = useAISettingValue()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { handleFileInputChange } = useFileUploadWithDefaults()
    const { present } = useModalStack()
    const canCreateNewTask = useCanCreateNewAITask()

    // Filter enabled shortcuts
    const enabledShortcuts = useMemo(
      () => shortcuts.filter((shortcut) => shortcut.enabled),
      [shortcuts],
    )

    const handleAttachFile = useCallback(() => {
      fileInputRef.current?.click()
    }, [])

    const handleScheduleActionClick = () => {
      if (!canCreateNewTask) {
        toast.error("Please remove an existing task before creating a new one.")
        return
      }
      present({
        title: "New AI Task",
        canClose: true,
        content: () => <AITaskModal showSettingsTip />,
      })
    }

    return (
      <div className={cn("flex flex-wrap items-center gap-2 px-4 py-3", className)}>
        {/* Add Context Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="bg-material-medium hover:bg-material-thin border-border text-text-secondary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
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

        <ActionButton
          className="bg-material-medium hover:bg-material-thin border-border text-text-secondary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
          tooltip="Schedule Action"
          onClick={handleScheduleActionClick}
        >
          <i className="i-mgc-calendar-time-add-cute-re size-3.5" />
        </ActionButton>

        {/* Context Blocks */}
        {blocks.map((block) => (
          <ContextBlock key={block.id} block={block} />
        ))}
      </div>
    )
  },
)
AIChatContextBar.displayName = "AIChatContextBar"
