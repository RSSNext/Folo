import { stopPropagation } from "@follow/utils"
import type { UIDataTypes, UIMessage } from "ai"
import { m } from "motion/react"
import * as React from "react"
import { toast } from "sonner"

import { copyToClipboard } from "~/lib/clipboard"
import { useChatActions } from "~/modules/ai/chat/__internal__/hooks"
import type { BizUIMetadata, BizUITools } from "~/modules/ai/chat/__internal__/types"
import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai/chat/atoms/session"

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

  // Get message content for editing
  const messageContent = React.useMemo(() => {
    return (
      message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ") || ""
    )
  }, [message.parts])

  const handleEdit = React.useCallback(() => {
    if (isUserMessage) {
      setEditingMessageId(messageId)
    }
  }, [isUserMessage, messageId, setEditingMessageId])

  const handleSaveEdit = React.useCallback(
    (newContent: string) => {
      const messages = chatActions.getMessages()
      if (newContent.trim() !== messageContent.trim()) {
        // Find the message index and remove all messages after it (including AI responses)
        const messageIndex = messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex !== -1) {
          const messagesToKeep = messages.slice(0, messageIndex)
          chatActions.setMessages(messagesToKeep)

          // Send the edited message
          chatActions.sendMessage(newContent)
        }
      }
      setEditingMessageId(null)
    },
    [messageContent, messageId, chatActions, setEditingMessageId],
  )

  const handleCancelEdit = React.useCallback(() => {
    setEditingMessageId(null)
  }, [setEditingMessageId])

  const handleCopy = React.useCallback(async () => {
    try {
      await copyToClipboard(messageContent)
      toast.success("Message copied to clipboard")
    } catch {
      toast.error("Failed to copy message")
    }
  }, [messageContent])

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
            initialContent={messageContent}
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

// Typing indicator component
export const AIChatTypingIndicator: React.FC = () => {
  return (
    <m.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-[70%] rounded-xl border border-gray-200/60 bg-gradient-to-br from-white/80 to-gray-50/90 px-3 py-2.5 shadow-lg shadow-black/5 backdrop-blur-sm dark:border-zinc-700/60 dark:from-zinc-800/80 dark:to-zinc-900/90 dark:shadow-black/20">
        <div className="mb-2 flex items-center gap-2">
          <div className="from-orange flex size-5 items-center justify-center rounded-full bg-gradient-to-r to-red-500">
            <i className="i-mgc-ai-cute-re size-3 text-white" />
          </div>
          <span className="text-text-secondary text-xs font-medium">{APP_NAME} AI</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-text-tertiary size-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-text-tertiary size-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-text-tertiary size-2 animate-bounce rounded-full" />
        </div>
      </div>
    </m.div>
  )
}
