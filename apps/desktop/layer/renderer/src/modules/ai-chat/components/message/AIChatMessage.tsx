import { createDefaultLexicalEditor } from "@follow/components/ui/lexical-rich-editor/editor.js"
import { stopPropagation, thenable } from "@follow/utils"
import type { LexicalEditor } from "lexical"
import { m } from "motion/react"
import * as React from "react"
import { toast } from "sonner"

import { copyToClipboard } from "~/lib/clipboard"
import type { BizUIMessage } from "~/modules/ai-chat/store/types"

import { MentionPlugin } from "../../editor"
import type { RichTextPart } from "../../types/ChatSession"
import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { AIMessageParts } from "./AIMessageParts"
import { TokenUsagePill } from "./TokenUsagePill"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatMessageProps {
  message: BizUIMessage
  isLastMessage: boolean
}

// Utility function for converting message to markdown
const useMessageMarkdownFormat = (message: BizUIMessage) => {
  return React.useCallback(() => {
    let content = ""
    for (const part of message.parts) {
      let lexicalEditor: LexicalEditor | null = null
      switch (part.type) {
        case "text": {
          content += part.text
          break
        }
        case "data-rich-text": {
          lexicalEditor ||= createDefaultLexicalEditor([MentionPlugin])
          lexicalEditor.setEditorState(
            lexicalEditor.parseEditorState((part as RichTextPart).data.state),
          )
          content += convertLexicalToMarkdown(lexicalEditor)
          break
        }

        default: {
          if (part.type.startsWith("tool-")) {
            content += `\n\n[TOOL CALL: ${part.type.replace("tool-", "")}]\n\n`
          }
          break
        }
      }
    }
    return content
  }, [message.parts])
}

// AI message component
export const AIChatMessage: React.FC<AIChatMessageProps> = React.memo(
  ({ message, isLastMessage }) => {
    if (message.parts.length === 0) {
      throw thenable
    }

    const getMessageMarkdownFormat = useMessageMarkdownFormat(message)

    const handleCopy = React.useCallback(async () => {
      const messageContent = getMessageMarkdownFormat()
      try {
        await copyToClipboard(messageContent)
        toast.success("Message copied to clipboard")
      } catch {
        toast.error("Failed to copy message")
      }
    }, [getMessageMarkdownFormat])

    return (
      <div onContextMenu={stopPropagation} className="group flex justify-start">
        <div className="text-text relative flex max-w-full flex-col gap-2">
          {/* Normal message display */}
          <div className="text-text">
            <div className="flex select-text flex-col gap-2 text-sm">
              <AIMessageParts message={message} isLastMessage={isLastMessage} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="absolute -left-2 bottom-1 right-0 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="text-text-secondary hover:bg-fill-tertiary flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
              title="Copy message"
            >
              <i className="i-mgc-copy-2-cute-re size-3" />
              <span>Copy</span>
            </button>

            {message.metadata && (
              <TokenUsagePill metadata={message.metadata}>
                <button
                  type="button"
                  className="text-text-secondary hover:bg-fill-tertiary absolute right-0 flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                >
                  <i className="i-mgc-information-cute-re size-3" />
                </button>
              </TokenUsagePill>
            )}
          </div>

          <div className="h-6" />
        </div>
      </div>
    )
  },
)

export const AIChatWaitingIndicator: React.FC = () => {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-4"
    >
      <div className="text-text-secondary flex items-center gap-2 rounded-full text-xs">
        <i className="i-mgc-loading-3-cute-re size-3 animate-spin" />
        <span className="font-medium">Thinking…</span>
      </div>
    </m.div>
  )
}
