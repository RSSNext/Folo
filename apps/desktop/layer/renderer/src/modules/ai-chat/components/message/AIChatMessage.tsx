import { createDefaultLexicalEditor } from "@follow/components/ui/lexical-rich-editor/editor.js"
import { convertLexicalToMarkdown } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { stopPropagation, thenable } from "@follow/utils"
import type { LexicalEditor } from "lexical"
import { m } from "motion/react"
import * as React from "react"
import { toast } from "sonner"

import { RelativeTime } from "~/components/ui/datetime"
import { copyToClipboard } from "~/lib/clipboard"
import type { BizUIMessage } from "~/modules/ai-chat/store/types"

import { MentionPlugin, ShortcutPlugin } from "../../editor"
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
          lexicalEditor ||= createDefaultLexicalEditor([MentionPlugin, ShortcutPlugin])
          lexicalEditor.setEditorState(lexicalEditor.parseEditorState(part.data.state))
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

const filterEmptyMessagePart = (messageParts: BizUIMessage["parts"]) => {
  const parts = [] as BizUIMessage["parts"]
  for (const part of messageParts) {
    switch (part.type) {
      case "step-start": {
        break
      }
      case "reasoning":
      case "text": {
        if (part.text) {
          parts.push(part)
        }
        break
      }
      default: {
        parts.push(part)
        break
      }
    }
  }
  return parts
}

export const AIChatMessage: React.FC<AIChatMessageProps> = React.memo(
  ({ message: originalMessage, isLastMessage }) => {
    const message = React.useMemo(() => {
      return {
        ...originalMessage,
        parts: filterEmptyMessagePart(originalMessage.parts),
      }
    }, [originalMessage])
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
        <div className="relative flex max-w-full flex-col gap-2 text-text">
          {/* Normal message display */}
          <div className="text-text">
            <div className="flex cursor-text select-text flex-col gap-2 text-sm">
              <AIMessageParts message={message} isLastMessage={isLastMessage} />
            </div>
          </div>

          {/* Action buttons */}
          {!!originalMessage.metadata?.finishTime && (
            <div className="absolute -left-2 bottom-1 right-0 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="whitespace-nowrap px-2 py-1 text-[11px] leading-none text-text-tertiary">
                <RelativeTime date={originalMessage.createdAt} />
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-fill-tertiary"
                title="Copy message"
              >
                <i className="i-mgc-copy-2-cute-re size-3" />
                <span>Copy</span>
              </button>

              {message.metadata && (
                <TokenUsagePill metadata={message.metadata}>
                  <button
                    type="button"
                    className="absolute right-0 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-fill-tertiary"
                  >
                    <i className="i-mgc-information-cute-re size-3" />
                  </button>
                </TokenUsagePill>
              )}
            </div>
          )}
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
      <div className="flex items-center gap-2 rounded-full text-xs text-text-secondary">
        <i className="i-mgc-loading-3-cute-re size-3 animate-spin" />
        <span className="font-medium">Thinking…</span>
      </div>
    </m.div>
  )
}
