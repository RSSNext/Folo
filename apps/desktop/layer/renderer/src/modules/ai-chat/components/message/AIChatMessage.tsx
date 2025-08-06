import { createDefaultLexicalEditor } from "@follow/components/ui/lexical-rich-editor/editor.js"
import { stopPropagation } from "@follow/utils"
import type { UIDataTypes, UIMessage } from "ai"
import type { LexicalEditor, SerializedEditorState } from "lexical"
import { m } from "motion/react"
import * as React from "react"
import { toast } from "sonner"

import { copyToClipboard } from "~/lib/clipboard"
import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai-chat/atoms/session"
import { useChatActions } from "~/modules/ai-chat/store/hooks"
import type { BizUIMetadata, BizUITools } from "~/modules/ai-chat/store/types"

import type { RichTextPart } from "../../types/ChatSession"
import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { AIMessageParts } from "./AIMessageParts"
import { EditableMessage } from "./EditableMessage"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatMessageProps {
  message: UIMessage<BizUIMetadata, UIDataTypes, BizUITools>
  onEdit?: (messageId: string) => void
  streaming?: boolean
}

export const AIChatMessage: React.FC<AIChatMessageProps> = React.memo(({ message }) => {
  const chatActions = useChatActions()

  const messageId = message.id
  const [isHovered, setIsHovered] = React.useState(false)
  const editingMessageId = useEditingMessageId()
  const setEditingMessageId = useSetEditingMessageId()

  const isEditing = editingMessageId === messageId
  const isUserMessage = message.role === "user"

  const handleEdit = React.useCallback(() => {
    if (isUserMessage) {
      setEditingMessageId(messageId)
    }
  }, [isUserMessage, messageId, setEditingMessageId])

  const getMessageMarkdownFormat = React.useCallback(() => {
    let content = ""
    for (const part of message.parts) {
      let lexicalEditor: LexicalEditor | null = null
      switch (part.type) {
        case "text": {
          content += part.text
          break
        }
        case "data-rich-text": {
          lexicalEditor ||= createDefaultLexicalEditor()
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

  const handleSaveEdit = React.useCallback(
    (newState: SerializedEditorState, editor: LexicalEditor) => {
      const messageContent = convertLexicalToMarkdown(editor)
      const messages = chatActions.getMessages()
      const messageIndex = messages.findIndex((msg) => msg.id === messageId)
      if (messageIndex !== -1) {
        const messagesToKeep = messages.slice(0, messageIndex)
        const nextMessage = messages[messageIndex]!
        chatActions.setMessages(messagesToKeep)

        const richTextPart = nextMessage.parts.find(
          (part) => part.type === "data-rich-text",
        ) as RichTextPart
        if (richTextPart) {
          richTextPart.data = {
            state: newState,
            text: messageContent,
          }
        }

        // Send the edited message
        chatActions.sendMessage(nextMessage)
      }
      setEditingMessageId(null)
    },
    [chatActions, messageId, setEditingMessageId],
  )

  const handleCancelEdit = React.useCallback(() => {
    setEditingMessageId(null)
  }, [setEditingMessageId])

  const handleCopy = React.useCallback(async () => {
    const messageContent = getMessageMarkdownFormat()
    try {
      await copyToClipboard(messageContent)
      toast.success("Message copied to clipboard")
    } catch {
      toast.error("Failed to copy message")
    }
  }, [getMessageMarkdownFormat])

  const handleRetry = React.useCallback(() => {
    chatActions.regenerate({ messageId })
  }, [chatActions, messageId])

  return (
    <m.div
      onContextMenu={stopPropagation}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: message.role === "user" ? 0.1 : 0.2,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex max-w-[calc(100%-1rem)] flex-col gap-2">
        {/* Show editable message if editing */}
        {isEditing && isUserMessage ? (
          <EditableMessage
            messageId={messageId}
            parts={message.parts}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            {/* Normal message display */}
            <div
              className={`rounded-xl px-3 py-2.5 backdrop-blur-sm ${
                message.role === "user"
                  ? "dark:bg-accent/30 bg-accent/90 text-white"
                  : "text-text border border-gray-200/60 bg-gradient-to-br from-white/80 to-gray-50/90 shadow-lg shadow-black/5 dark:border-zinc-700/60 dark:from-zinc-800/80 dark:to-zinc-900/90 dark:shadow-black/20"
              }`}
            >
              {message.role === "assistant" && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="from-folo flex size-5 items-center justify-center rounded-full bg-gradient-to-r to-red-500 shadow-sm">
                    <i className="i-mgc-ai-cute-fi size-3 text-white" />
                  </div>
                  <span className="text-text-secondary text-xs font-medium">{APP_NAME} AI</span>
                </div>
              )}
              <div
                className={`select-text gap-2 text-[0.95rem] ${
                  message.role === "user" ? "text-white" : "text-text"
                } flex flex-col`}
              >
                <AIMessageParts message={message} />
              </div>
              {message.metadata?.finishTime && (
                <div
                  className={`mt-2 text-xs ${message.role === "user" ? "text-text-secondary-dark text-right" : "text-text-tertiary"}`}
                >
                  {new Date(message.metadata.finishTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <m.div
              className={`absolute bottom-0 flex ${message.role === "user" ? "right-0" : "left-0"} gap-1`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {message.role === "user" ? (
                <>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="text-text-tertiary hover:bg-fill hover:text-text flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                    title="Edit message"
                  >
                    <i className="i-mgc-edit-cute-re size-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-text-tertiary hover:bg-fill hover:text-text flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                    title="Retry"
                  >
                    <i className="i-mgc-refresh-2-cute-re size-3" />
                    <span>Retry</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-text-tertiary hover:bg-fill hover:text-text flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                  title="Copy message"
                >
                  <i className="i-mgc-copy-2-cute-re size-3" />
                  <span>Copy</span>
                </button>
              )}
            </m.div>

            <div className="h-6" />
          </>
        )}
      </div>
    </m.div>
  )
})

export const AIChatWaitingIndicator: React.FC = () => {
  return (
    <span className="text-text-tertiary text-xs">
      <i className="i-mgc-loading-3-cute-re size-3 animate-spin" />
    </span>
  )
}
