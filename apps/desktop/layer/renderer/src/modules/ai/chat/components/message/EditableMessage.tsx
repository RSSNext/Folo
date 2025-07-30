import { useInputComposition } from "@follow/hooks"
import { cn } from "@follow/utils"
import { useCallback, useEffect, useRef, useState } from "react"

import { useChatStatus } from "~/modules/ai/chat/__internal__/hooks"
import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai/chat/atoms/session"

interface EditableMessageProps {
  messageId: string
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
  className?: string
}

export const EditableMessage = ({
  messageId,
  initialContent,
  onSave,
  onCancel,
  className,
}: EditableMessageProps) => {
  const status = useChatStatus()
  const editingMessageId = useEditingMessageId()
  const setEditingMessageId = useSetEditingMessageId()
  const [content, setContent] = useState(initialContent)
  const [isEmpty, setIsEmpty] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isEditing = editingMessageId === messageId
  const isProcessing = status === "submitted" || status === "streaming"

  // Auto-resize textarea and maintain minimum height to prevent CLS
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      const textarea = textareaRef.current
      textarea.style.height = "auto"
      const newHeight = Math.max(56, textarea.scrollHeight) // Minimum height of 56px
      textarea.style.height = `${newHeight}px`
    }
  }, [content, isEditing])

  // Focus on edit start
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      )
    }
  }, [isEditing])

  const handleSave = useCallback(() => {
    if (content.trim() && content.trim() !== initialContent) {
      onSave(content.trim())
    }
    setEditingMessageId(null)
  }, [content, initialContent, onSave, setEditingMessageId])

  const handleCancel = useCallback(() => {
    setContent(initialContent)
    setEditingMessageId(null)
    onCancel()
  }, [initialContent, onCancel, setEditingMessageId])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (!isProcessing) {
          handleSave()
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel, isProcessing],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setIsEmpty(newContent.trim() === "")
  }, [])

  const inputProps = useInputComposition<HTMLTextAreaElement>({
    onKeyDown: handleKeyPress,
  })

  if (!isEditing) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      {/* Edit input */}
      <div className="bg-background/60 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80 relative overflow-hidden rounded-xl border backdrop-blur-xl duration-200 focus-within:ring-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          {...inputProps}
          placeholder="Edit your message..."
          className="scrollbar-none text-text placeholder:text-text-secondary max-h-40 min-h-14 w-full resize-none bg-transparent px-4 py-3 pr-20 text-sm !outline-none transition-all duration-200"
          rows={1}
          disabled={isProcessing}
        />

        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="text-text-tertiary hover:text-text hover:bg-fill/50 flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
            title="Cancel (Esc)"
          >
            <i className="i-mgc-close-cute-re size-4" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || isEmpty || content.trim() === initialContent}
            className="text-accent hover:text-accent hover:bg-accent/10 flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
            title="Save (Enter)"
          >
            <i className="i-mgc-send-plane-cute-fi size-4" />
          </button>
        </div>
      </div>

      {/* Helper text */}
      <div className="text-text-tertiary mt-2 text-xs">
        Press <kbd className="bg-fill text-text-secondary rounded px-1 py-0.5">Enter</kbd> to save,{" "}
        <kbd className="bg-fill text-text-secondary rounded px-1 py-0.5">Esc</kbd> to cancel
      </div>
    </div>
  )
}
