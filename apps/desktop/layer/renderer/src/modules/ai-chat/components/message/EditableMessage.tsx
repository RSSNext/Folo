import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import { LexicalRichEditor } from "@follow/components/ui/lexical-rich-editor/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame } from "@follow/utils"
import type { BizUIMessage } from "@folo-services/ai-tools"
import { isEqual } from "es-toolkit"
import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical"
import { $getRoot } from "lexical"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai-chat/atoms/session"
import { useChatStatus } from "~/modules/ai-chat/store/hooks"

import { MentionPlugin, ShortcutPlugin } from "../../editor"

interface EditableMessageProps {
  messageId: string
  parts: BizUIMessage["parts"]
  onSave: (content: SerializedEditorState, editor: LexicalEditor) => void
  onCancel: () => void
  className?: string
  initialHeight?: number
}

export const EditableMessage = ({
  messageId,
  parts,
  onSave,
  onCancel,
  className,
  initialHeight,
}: EditableMessageProps) => {
  const status = useChatStatus()
  const editingMessageId = useEditingMessageId()
  const setEditingMessageId = useSetEditingMessageId()
  const [isEmpty, setIsEmpty] = useState(false)
  const editorRef = useRef<LexicalRichEditorRef>(null)
  const [currentEditor, setCurrentEditor] = useState<LexicalEditor | null>(null)

  const initialEditorState = useMemo(() => {
    return (parts.find((part) => part.type === "data-rich-text") as any)?.data
      .state as SerializedEditorState
  }, [parts])

  const isEditing = editingMessageId === messageId
  const isProcessing = status === "submitted" || status === "streaming"

  // Compute initial editor height based on original message height
  const editorInitialHeight = Math.max(56, initialHeight ?? 56)

  // Initialize editor with initial content
  useEffect(() => {
    if (isEditing && editorRef.current && currentEditor) {
      // Focus the editor
      editorRef.current.focus()
    }
  }, [isEditing, currentEditor])

  const setInitialEditorStateOnceRef = useRef(false)

  useEffect(() => {
    return nextFrame(() => {
      if (setInitialEditorStateOnceRef.current) return
      const editor = editorRef.current?.getEditor()

      if (!editor) return
      editor.setEditorState(editor.parseEditorState(initialEditorState))
      setInitialEditorStateOnceRef.current = true
    })
  }, [initialEditorState])

  const handleSave = useCallback(() => {
    if (currentEditor && editorRef.current && !editorRef.current.isEmpty()) {
      const serializedEditorState = currentEditor.getEditorState().toJSON()

      if (!isEqual(serializedEditorState, initialEditorState)) {
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
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-background/60 backdrop-blur-xl duration-200 focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/20">
        <ScrollArea
          rootClassName="mr-20 flex-1 overflow-auto"
          viewportClassName="px-5 py-3.5"
          viewportProps={{ style: { height: editorInitialHeight } }}
        >
          <LexicalRichEditor
            ref={editorRef}
            placeholder="Edit your message..."
            className="h-full min-w-64"
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            namespace="EditableMessageRichEditor"
            plugins={[MentionPlugin, ShortcutPlugin]}
          />
        </ScrollArea>

        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex size-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-fill/50 hover:text-text disabled:opacity-50"
            title="Cancel (Esc)"
          >
            <i className="i-mgc-close-cute-re size-4" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || isEmpty}
            className="flex size-8 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
            title="Save (Enter)"
          >
            <i className="i-mgc-send-plane-cute-fi size-4" />
          </button>
        </div>
      </div>

      {/* Helper text */}
      <div className="relative mt-2">
        <div className="absolute -inset-x-2 -bottom-2 -top-8 z-[-1] bg-background" />
        <div className="relative z-[1] text-xs text-text-secondary">
          Press <Kbd abbr="Enter">Enter</Kbd> to save, <Kbd abbr="Esc">Esc</Kbd> to cancel
        </div>
      </div>
    </div>
  )
}
