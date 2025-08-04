import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import { LexicalRichEditor } from "@follow/components/ui/lexical-rich-editor/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, stopPropagation } from "@follow/utils"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { memo, useCallback, useRef, useState } from "react"

import { AIChatContextBar } from "~/modules/ai/chat/components/AIChatContextBar"

import { useChatActions, useChatError, useChatStatus } from "../../__internal__/hooks"
import { MentionPlugin } from "../../editor"
import { AIChatSendButton } from "./AIChatSendButton"
import { CollapsibleError } from "./CollapsibleError"

const chatInputVariants = cva(
  [
    "bg-background/60 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80",
    "relative overflow-hidden rounded-2xl border backdrop-blur-xl duration-200 focus-within:ring-2",
  ],
  {
    variants: {
      variant: {
        default: "shadow-2xl shadow-black/5 dark:shadow-zinc-800",
        minimal: "shadow shadow-zinc-100 dark:shadow-black/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

interface ChatInputProps extends VariantProps<typeof chatInputVariants> {
  onSend: (message: EditorState | string, editor: LexicalEditor | null) => void
}

export const ChatInput = memo(({ onSend, variant }: ChatInputProps) => {
  const status = useChatStatus()
  const chatActions = useChatActions()
  const error = useChatError()
  const stop = useCallback(() => {
    chatActions.stop()
  }, [chatActions])

  const editorRef = useRef<LexicalRichEditorRef>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [currentEditor, setCurrentEditor] = useState<LexicalEditor | null>(null)

  const isProcessing = status === "submitted" || status === "streaming"

  const handleSend = useCallback(() => {
    if (currentEditor && editorRef.current && !editorRef.current.isEmpty()) {
      onSend(currentEditor.getEditorState(), currentEditor)
      editorRef.current.clear()
    }
  }, [currentEditor, onSend])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        if (isProcessing) {
          stop?.()
        } else {
          handleSend()
        }
        return true
      }
      return false
    },
    [handleSend, isProcessing, stop],
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

  return (
    <div className="w-full">
      {/* Error Display */}
      {error && <CollapsibleError error={error} />}

      {/* Integrated Input Container with Context Bar */}
      <div className={cn(chatInputVariants({ variant }))}>
        {/* Input Area */}
        <div className="relative z-10 flex items-end" onContextMenu={stopPropagation}>
          <ScrollArea rootClassName="mx-5 my-3.5 mr-14 flex-1 overflow-auto">
            <LexicalRichEditor
              ref={editorRef}
              placeholder="Message AI assistant..."
              className="w-full"
              onChange={handleEditorChange}
              onKeyDown={handleKeyDown}
              autoFocus
              plugins={[MentionPlugin]}
              namespace="AIChatRichEditor"
            />
          </ScrollArea>
          <div className="absolute right-3 top-3">
            <AIChatSendButton
              onClick={isProcessing ? stop : handleSend}
              disabled={!isProcessing && isEmpty}
              isProcessing={isProcessing}
              size="sm"
            />
          </div>
        </div>

        {/* Context Bar - Always shown, positioned below the input area */}
        <div className="border-border/20 relative z-10 border-t bg-transparent">
          <AIChatContextBar
            className="border-0 bg-transparent px-4 py-2.5"
            onSendShortcut={(prompt) => onSend(prompt, null)}
          />
        </div>
      </div>
    </div>
  )
})

ChatInput.displayName = "ChatInput"
