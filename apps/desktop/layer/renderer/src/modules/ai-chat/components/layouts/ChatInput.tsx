import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import { LexicalRichEditor } from "@follow/components/ui/lexical-rich-editor/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame, stopPropagation } from "@follow/utils"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import type { Ref } from "react"
import { memo, use, useCallback, useImperativeHandle, useRef, useState } from "react"
import { matchKeyBindingPress, parseKeybinding } from "tinykeys"

import { AIChatContextBar } from "~/modules/ai-chat/components/layouts/AIChatContextBar"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { getCommand } from "~/modules/command/hooks/use-command"
import { useCommandShortcut } from "~/modules/command/hooks/use-command-binding"

import { FileUploadPlugin, MentionPlugin, ShortcutPlugin } from "../../editor"
import { useMainEntryId } from "../../hooks/useMainEntryId"
import { AIPanelRefsContext } from "../../store/AIChatContext"
import { useChatActions, useChatScene, useChatStatus } from "../../store/hooks"
import { AIChatSendButton } from "./AIChatSendButton"
import { AIModelIndicator } from "./AIModelIndicator"

const chatInputVariants = cva(
  [
    "bg-mix-background/transparent-8/2 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80",
    "relative overflow-hidden rounded-2xl border backdrop-blur-background duration-200 focus-within:ring-2",
    "z-[1]",
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
  ref?: Ref<LexicalRichEditorRef | null>
  initialDraftState?: EditorState
  onEditorStateChange?: (editorState: EditorState) => void
}

export const ChatInput = memo(
  ({
    onSend,
    variant,
    ref: forwardedRef,
    initialDraftState,
    onEditorStateChange,
  }: ChatInputProps) => {
    const status = useChatStatus()
    const chatActions = useChatActions()
    const mainEntryId = useMainEntryId()

    const stop = useCallback(() => {
      chatActions.stop()
    }, [chatActions])

    const editorRef = useRef<LexicalRichEditorRef | null>(null)

    useImperativeHandle<LexicalRichEditorRef | null, LexicalRichEditorRef | null>(
      forwardedRef,
      () => editorRef.current,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [editorRef.current],
    )

    const aiPanelRefs = use(AIPanelRefsContext)
    if (editorRef.current) {
      aiPanelRefs.inputRef.current = editorRef.current
    }

    const [isEmpty, setIsEmpty] = useState(true)
    const [currentEditor, setCurrentEditor] = useState<LexicalEditor | null>(null)

    const isProcessing = status === "submitted" || status === "streaming"

    const handleEditorChange = useCallback(
      (editorState: EditorState, editor: LexicalEditor) => {
        setCurrentEditor(editor)

        editorState.read(() => {
          const textContent = $getRoot().getTextContent().trim()
          setIsEmpty(textContent === "")
        })

        onEditorStateChange?.(editorState)
      },
      [onEditorStateChange],
    )

    const scene = useChatScene()

    const handleSend = useCallback(async () => {
      if (currentEditor && editorRef.current && !editorRef.current.isEmpty()) {
        const editorState = currentEditor?.getEditorState()
        nextFrame(() => {
          onSend(editorState, currentEditor)
        })
        editorRef.current.clear()
      }
    }, [currentEditor, onSend])

    const handleSendClick = useCallback(() => {
      void handleSend()
    }, [handleSend])

    const toggleAIChatShortcut = useCommandShortcut(COMMAND_ID.global.toggleAIChat)

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        // Check if the event matches the toggleAIChat shortcut using tinykeys utilities
        // Handle comma-separated shortcuts (e.g., "meta+i, ctrl+i")
        const shortcuts = toggleAIChatShortcut.split(",").map((s) => s.trim())

        const matchesToggleShortcut = shortcuts.some((shortcut) => {
          const presses = parseKeybinding(shortcut)

          // For single key shortcuts (not sequences), check if the first press matches
          return presses.length === 1 && presses[0] && matchKeyBindingPress(event, presses[0])
        })

        if (matchesToggleShortcut) {
          event.preventDefault()
          event.stopPropagation()

          getCommand(COMMAND_ID.global.toggleAIChat)?.run()

          return true
        }

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault()
          if (isProcessing) {
            return false
          }
          void handleSend()
          return true
        }

        return false
      },
      [handleSend, isProcessing, toggleAIChatShortcut],
    )

    return (
      <div data-testid="chat-input" className={cn(chatInputVariants({ variant }))}>
        {/* Input Area */}
        <div className="relative z-10 flex items-end" onContextMenu={stopPropagation}>
          <ScrollArea rootClassName="mr-14 flex-1 overflow-auto" viewportClassName="px-5 py-3.5">
            <LexicalRichEditor
              initalEditorState={initialDraftState}
              ref={editorRef}
              placeholder={
                scene === "onboarding"
                  ? "Enter your message"
                  : `Ask anything about this ${mainEntryId ? "entry" : "timeline"}...`
              }
              className="h-14"
              onChange={handleEditorChange}
              onKeyDown={handleKeyDown}
              autoFocus
              plugins={
                scene === "onboarding" ? [] : [MentionPlugin, ShortcutPlugin, FileUploadPlugin]
              }
              namespace="AIChatRichEditor"
            />
          </ScrollArea>
          <div className="absolute right-3 top-3">
            <AIChatSendButton
              onClick={isProcessing ? stop : handleSendClick}
              disabled={!isProcessing && isEmpty}
              isProcessing={isProcessing}
              size="sm"
            />
          </div>
        </div>

        {/* Context Bar - only shown in non-onboarding scene, positioned below the input area */}
        {scene !== "onboarding" && (
          <div className="relative z-10 border-t border-border/20 bg-transparent">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0 flex-1 shrink">
                <AIChatContextBar className="border-0 bg-transparent p-0" />
              </div>
              <div className="flex items-center gap-3 self-start">
                <AIModelIndicator className="-mr-1.5 ml-1 translate-y-[2px]" />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

ChatInput.displayName = "ChatInput"
