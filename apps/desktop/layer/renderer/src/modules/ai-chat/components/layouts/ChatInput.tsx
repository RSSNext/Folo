import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import { LexicalRichEditor } from "@follow/components/ui/lexical-rich-editor/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame, stopPropagation } from "@follow/utils"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { noop } from "es-toolkit"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import type { Ref } from "react"
import { memo, use, useCallback, useImperativeHandle, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AIChatContextBar } from "~/modules/ai-chat/components/layouts/AIChatContextBar"

import { FileUploadPlugin, MentionPlugin } from "../../editor"
import { useTimelineSummarySession } from "../../hooks/useTimelineSummarySession"
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
  isWelcomeScreen?: boolean
}

export const ChatInput = memo(
  ({ onSend, variant, ref: forwardedRef, isWelcomeScreen = false }: ChatInputProps) => {
    const status = useChatStatus()
    const chatActions = useChatActions()

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

    const handleEditorChange = useCallback((editorState: EditorState, editor: LexicalEditor) => {
      setCurrentEditor(editor)
      // Update isEmpty state based on editor content
      editorState.read(() => {
        const root = $getRoot()
        const textContent = root.getTextContent().trim()
        setIsEmpty(textContent === "")
      })
    }, [])

    const scene = useChatScene()

    // Determine if timeline summary can be reused and get today's session id
    const { canReuseTimelineSummary, todayTimelineSummaryId } = useTimelineSummarySession()

    const [reuseSummary, setReuseSummary] = useState(true)

    const handleSend = useCallback(async () => {
      if (currentEditor && editorRef.current && !editorRef.current.isEmpty()) {
        if (isWelcomeScreen && canReuseTimelineSummary && reuseSummary) {
          try {
            await chatActions.switchToChat(todayTimelineSummaryId)
          } catch {
            // ignore switch errors
          }
        }

        const editorState = currentEditor?.getEditorState()
        nextFrame(() => {
          onSend(editorState, currentEditor)
        })
        editorRef.current.clear()
      }
    }, [
      currentEditor,
      onSend,
      isWelcomeScreen,
      canReuseTimelineSummary,
      reuseSummary,
      chatActions,
      todayTimelineSummaryId,
    ])

    const handleSendClick = useCallback(() => {
      void handleSend()
    }, [handleSend])

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
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
      [handleSend, isProcessing],
    )

    const { t } = useTranslation("ai")

    return (
      <div className={cn(chatInputVariants({ variant }))}>
        {/* Input Area */}
        <div className="relative z-10 flex items-end" onContextMenu={stopPropagation}>
          <ScrollArea rootClassName="mx-5 my-3.5 mr-14 flex-1 overflow-auto">
            <LexicalRichEditor
              ref={editorRef}
              placeholder={scene === "onboarding" ? "Enter your message" : "Message, @ for context"}
              className="w-full"
              onChange={handleEditorChange}
              onKeyDown={handleKeyDown}
              autoFocus
              plugins={scene === "onboarding" ? [] : [MentionPlugin, FileUploadPlugin]}
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
          <div className="border-border/20 relative z-10 border-t bg-transparent">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0 flex-1 shrink">
                <AIChatContextBar className="border-0 bg-transparent p-0" />
              </div>
              <div className="flex items-center gap-3">
                {isWelcomeScreen && canReuseTimelineSummary && (
                  <label className="text-text-secondary flex select-none items-center gap-2 text-xs">
                    <Checkbox
                      checked={reuseSummary}
                      size="sm"
                      onCheckedChange={(v) => setReuseSummary(!!v)}
                    />
                    <span>
                      {t("timeline_summary.ask_option")}{" "}
                      <span className="text-text">{t("timeline_summary.heading")}</span>
                    </span>
                  </label>
                )}
                <AIModelIndicator
                  className="-mr-1.5 ml-1 translate-y-[2px] self-start"
                  // Current not support switch model, will open this feature later
                  onModelChange={noop}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

ChatInput.displayName = "ChatInput"
