import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import {
  createDefaultLexicalEditor,
  LexicalRichEditor,
} from "@follow/components/ui/lexical-rich-editor/index.js"
import { cn } from "@follow/utils"
import type { BizUIMessage } from "@folo-services/ai-tools"
import { isEqual } from "es-toolkit"
import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical"
import { $getRoot } from "lexical"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useChatStatus } from "~/modules/ai/chat/__internal__/hooks"
import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai/chat/atoms/session"

interface EditableMessageProps {
  messageId: string
  parts: BizUIMessage["parts"]
  onSave: (content: SerializedEditorState, editor: LexicalEditor) => void
  onCancel: () => void
  className?: string
}

export const EditableMessage = ({
  messageId,
  parts,
  onSave,
  onCancel,
  className,
}: EditableMessageProps) => {
  const status = useChatStatus()
  const editingMessageId = useEditingMessageId()
  const setEditingMessageId = useSetEditingMessageId()
  const [isEmpty, setIsEmpty] = useState(false)
  const editorRef = useRef<LexicalRichEditorRef>(null)
  const [currentEditor, setCurrentEditor] = useState<LexicalEditor | null>(null)

  const initialEditorState = useMemo(() => {
    const serializedEditorState = (parts.find((part) => part.type === "data-rich-text") as any)
      ?.data.state as SerializedEditorState
    return createDefaultLexicalEditor().parseEditorState(serializedEditorState)
  }, [parts])
  const isEditing = editingMessageId === messageId
  const isProcessing = status === "submitted" || status === "streaming"

  // Initialize editor with initial content
  useEffect(() => {
    if (isEditing && editorRef.current && currentEditor) {
      // Focus the editor
      editorRef.current.focus()
    }
  }, [isEditing, initialEditorState, currentEditor])

  const handleSave = useCallback(() => {
    if (currentEditor && editorRef.current && !editorRef.current.isEmpty()) {
      const serializedEditorState = currentEditor.getEditorState().toJSON()

      if (!isEqual(serializedEditorState, initialEditorState.toJSON())) {
        onSave(serializedEditorState, currentEditor)
      }
    }
  }, [currentEditor, initialEditorState, onSave])

  const handleCancel = useCallback(() => {
    setEditingMessageId(null)
    onCancel()
  }, [onCancel, setEditingMessageId])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        if (!isProcessing) {
          handleSave()
        }
        return true
      } else if (event.key === "Escape") {
        event.preventDefault()
        handleCancel()
        return true
      }
      return false
    },
    [handleSave, handleCancel, isProcessing],
  )

  const handleEditorChange = useCallback((editorState: EditorState, editor: LexicalEditor) => {
    setCurrentEditor(editor)
    // Update isEmpty state based on editor content
    editorState.read(() => {
      const root = $getRoot()
      const textContent = root.getTextContent().trim()
      setIsEmpty(textContent === "")
    })
  }, [])

  if (!isEditing) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      {/* Edit input */}
      <div className="bg-background/60 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80 relative overflow-hidden rounded-xl border backdrop-blur-xl duration-200 focus-within:ring-2">
        <LexicalRichEditor
          ref={editorRef}
          placeholder="Edit your message..."
          initalEditorState={initialEditorState}
          className="w-full pr-20"
          onChange={handleEditorChange}
          onKeyDown={handleKeyDown}
          namespace="EditableMessageRichEditor"
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
            disabled={isProcessing || isEmpty}
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
