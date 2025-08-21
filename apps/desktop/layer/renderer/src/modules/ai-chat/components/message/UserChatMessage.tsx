import { stopPropagation, thenable } from "@follow/utils"
import type { UIDataTypes, UIMessage } from "ai"
import type { LexicalEditor, SerializedEditorState } from "lexical"
import { m } from "motion/react"
import * as React from "react"

import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai-chat/atoms/session"
import { useChatActions } from "~/modules/ai-chat/store/hooks"
import type { BizUIMetadata, BizUITools } from "~/modules/ai-chat/store/types"

import type { RichTextPart } from "../../types/ChatSession"
import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { EditableMessage } from "./EditableMessage"
import { UserMessageParts } from "./UserMessageParts"

interface UserChatMessageProps {
  message: UIMessage<BizUIMetadata, UIDataTypes, BizUITools>
}

export const UserChatMessage: React.FC<UserChatMessageProps> = React.memo(({ message }) => {
  if (message.parts.length === 0) {
    throw thenable
  }

  const chatActions = useChatActions()
  const messageId = message.id
  const [isHovered, setIsHovered] = React.useState(false)
  const editingMessageId = useEditingMessageId()
  const setEditingMessageId = useSetEditingMessageId()

  const isEditing = editingMessageId === messageId

  const handleEdit = React.useCallback(() => {
    setEditingMessageId(messageId)
  }, [messageId, setEditingMessageId])

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

  const handleRetry = React.useCallback(() => {
    chatActions.regenerate({ messageId })
  }, [chatActions, messageId])

  return (
    <div
      onContextMenu={stopPropagation}
      className="group flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-text relative flex max-w-[calc(100%-1rem)] flex-col gap-2">
        {/* Show editable message if editing */}
        {isEditing ? (
          <EditableMessage
            messageId={messageId}
            parts={message.parts}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            {/* Normal message display */}
            <div className="text-text rounded-2xl bg-gray-100 px-4 py-2.5 backdrop-blur-sm dark:bg-gray-800">
              <div className="flex select-text flex-col gap-2 text-sm">
                <UserMessageParts message={message} />
              </div>
            </div>

            {/* Action buttons */}
            <m.div
              className="absolute bottom-1 right-0 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={handleEdit}
                className="text-text hover:bg-fill-secondary flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                title="Edit message"
              >
                <i className="i-mgc-edit-cute-re size-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="text-text hover:bg-fill-secondary flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                title="Retry"
              >
                <i className="i-mgc-refresh-2-cute-re size-3" />
                <span>Retry</span>
              </button>
            </m.div>

            <div className="h-6" />
          </>
        )}
      </div>
    </div>
  )
})
