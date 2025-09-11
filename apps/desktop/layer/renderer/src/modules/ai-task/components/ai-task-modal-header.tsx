import { ActionButton } from "@follow/components/ui/button/index.js"
import { memo } from "react"

import { EditableTitle } from "~/modules/ai-chat/components/layouts/EditableTitle"

interface AITaskModalHeaderProps {
  title: string
  error?: string
  placeholder?: string
  maxLength?: number
  onClose: () => void
  onSaveTitle: (newTitle: string) => Promise<void> | void
}

export const AITaskModalHeader = memo(function AITaskModalHeader({
  title,
  error,
  placeholder = "AI Task",
  maxLength = 50,
  onClose,
  onSaveTitle,
}: AITaskModalHeaderProps) {
  return (
    <div className="-mt-4 ml-6 mr-2 flex min-w-0 flex-1 items-start gap-2">
      <EditableTitle
        title={title}
        placeholder={placeholder}
        maxLength={maxLength}
        onSave={async (newTitle) => {
          await onSaveTitle(newTitle.trim() || placeholder)
        }}
        className="py-3"
      />
      <ActionButton tooltip="Close" onClick={onClose}>
        <i className="i-mgc-close-cute-re text-text-secondary size-5" />
      </ActionButton>
      {error && <div className="text-red absolute left-6 top-10 w-[320px] text-xs">{error}</div>}
    </div>
  )
})
