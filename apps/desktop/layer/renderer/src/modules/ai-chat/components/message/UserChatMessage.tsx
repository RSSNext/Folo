import { stopPropagation, thenable } from "@follow/utils"
import type { UIDataTypes, UIMessage } from "ai"
import type { LexicalEditor, SerializedEditorState } from "lexical"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai-chat/atoms/session"
import { useChatActions } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, BizUIMetadata, BizUITools } from "~/modules/ai-chat/store/types"

import type { RichTextPart } from "../../types/ChatSession"
import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { AIDataBlockPart } from "./AIDataBlockPart"
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

  // Extract data-block parts for separate rendering
  const dataBlockParts = React.useMemo(
    () => message.parts.filter((part) => part.type === "data-block"),
    [message.parts],
  )

  // Ref to measure data-block height for edit overlay positioning
  const dataBlockRef = React.useRef<HTMLDivElement>(null)
  const [dataBlockHeight, setDataBlockHeight] = React.useState(0)

  // Update data-block height when it changes
  React.useEffect(() => {
    if (dataBlockRef.current && dataBlockParts.length > 0) {
      const { height } = dataBlockRef.current.getBoundingClientRect()
      setDataBlockHeight(height + 12) // Add gap between data-block and message (0.75rem = 12px)
    } else {
      setDataBlockHeight(0)
    }
  }, [dataBlockParts.length, isEditing])

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
    <div className="relative flex flex-col gap-3">
      {/* Render data-block parts separately, outside the chat bubble */}
      {dataBlockParts.length > 0 && (
        <div ref={dataBlockRef} className="flex justify-end">
          <div className="max-w-[calc(100%-1rem)]">
            {dataBlockParts.map((part) => {
              if (part.type === "data-block" && "data" in part) {
                const blocks = part.data as AIChatContextBlock[]
                return (
                  <AIDataBlockPart
                    key={`${messageId}-datablock-${blocks.map((b) => b.id).join("-")}`}
                    blocks={blocks}
                  />
                )
              }
              return null
            })}
          </div>
        </div>
      )}

      {/* Main chat message */}
      <div
        onContextMenu={stopPropagation}
        className="group flex justify-end"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="text-text relative flex max-w-[calc(100%-1rem)] flex-col gap-2">
          {/* Normal message display - always rendered to maintain layout */}
          <div className="text-text rounded-2xl bg-[color-mix(in_srgb,hsl(var(--fo-a)),hsl(var(--background))_70%)] px-4 py-2.5 backdrop-blur-sm">
            <div className="flex select-text flex-col gap-2 text-sm">
              <UserMessageParts message={message} />
            </div>
          </div>

          {/* Action buttons - only show when not editing */}
          {!isEditing && (
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
                className="text-text-secondary hover:bg-fill-secondary flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                title="Edit message"
              >
                <i className="i-mgc-edit-cute-re size-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="text-text-secondary hover:bg-fill-secondary flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                title="Retry"
              >
                <i className="i-mgc-refresh-2-cute-re size-3" />
                <span>Retry</span>
              </button>
            </m.div>
          )}

          <div className="h-6" />
        </div>
      </div>

      {/* Full-width edit overlay - positioned at the top level to span entire container */}
      <AnimatePresence>
        {isEditing && (
          <m.div
            className="absolute inset-x-0 bottom-0 z-10 flex"
            style={{
              top: dataBlockHeight > 0 ? `${dataBlockHeight}px` : 0,
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="w-full max-w-[var(--ai-chat-layout-width,65ch)]">
              <EditableMessage
                messageId={messageId}
                parts={message.parts}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                className="min-h-full w-full"
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
})
