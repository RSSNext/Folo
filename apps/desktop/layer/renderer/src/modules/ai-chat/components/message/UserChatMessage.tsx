import { Spring } from "@follow/components/constants/spring.js"
import { convertLexicalToMarkdown } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { nextFrame, stopPropagation, thenable } from "@follow/utils"
import type { LexicalEditor, SerializedEditorState } from "lexical"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { RelativeTime } from "~/components/ui/datetime"
import { useEditingMessageId, useSetEditingMessageId } from "~/modules/ai-chat/atoms/session"
import { useChatActions, useChatScene, useChatStatus } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, BizUIMessage } from "~/modules/ai-chat/store/types"

import { AIDataBlockPart } from "./AIDataBlockPart"
import { AIMessageIdContext } from "./AIMessageIdContext"
import { EditableMessage } from "./EditableMessage"
import { UserMessageParts } from "./UserMessageParts"

interface UserChatMessageProps {
  message: BizUIMessage
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

  const chatStatus = useChatStatus()

  const isStreaming = chatStatus === "submitted" || chatStatus === "streaming"
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

  // Measure original message bubble height to initialize edit box height
  const messageBubbleRef = React.useRef<HTMLDivElement>(null)
  const [messageBubbleHeight, setMessageBubbleHeight] = React.useState(56)
  // Only compute once before edit overlay appears

  const handleEdit = React.useCallback(() => {
    const el = messageBubbleRef.current
    if (el) {
      const { height } = el.getBoundingClientRect()
      setMessageBubbleHeight(Math.max(56, Math.round(height)))
    }
    nextFrame(() => {
      setEditingMessageId(messageId)
    })
  }, [messageId, setEditingMessageId, setMessageBubbleHeight])

  const handleSaveEdit = React.useCallback(
    (newState: SerializedEditorState, editor: LexicalEditor) => {
      const messageContent = convertLexicalToMarkdown(editor)
      const messages = chatActions.getMessages()
      const messageIndex = messages.findIndex((msg) => msg.id === messageId)
      if (messageIndex !== -1) {
        const messagesToKeep = messages.slice(0, messageIndex)
        const nextMessage = messages[messageIndex]!
        chatActions.setMessages(messagesToKeep)

        const richTextPart = nextMessage.parts.find((part) => part.type === "data-rich-text")
        if (richTextPart) {
          richTextPart.data = {
            state: JSON.stringify(newState),
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

  const scene = useChatScene()

  return (
    <AIMessageIdContext value={messageId}>
      <div className="relative flex flex-col gap-3">
        {/* Render data-block parts separately, outside the chat bubble */}
        {dataBlockParts.length > 0 && scene !== "onboarding" && dataBlockParts.length > 0 && (
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
        <m.div
          initial={
            isStreaming
              ? {
                  opacity: 0,
                  y: 20,
                  scale: 0.95,
                }
              : true
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={Spring.presets.smooth}
          onContextMenu={stopPropagation}
          className="group flex justify-end"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative flex max-w-[calc(100%-1rem)] flex-col gap-2 text-text">
            <div
              ref={messageBubbleRef}
              className="rounded-2xl bg-fill-tertiary px-4 py-2.5 text-text"
            >
              <div className="flex select-text flex-col gap-2 text-sm">
                <UserMessageParts message={message} />
              </div>
            </div>

            {/* Action buttons - only show when not editing */}
            {!isEditing && (
              <m.div
                className="absolute bottom-1 right-0 flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span className="whitespace-nowrap px-2 py-1 text-[11px] leading-none text-text-tertiary">
                  <RelativeTime date={message.createdAt} />
                </span>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-fill-secondary"
                  title="Edit message"
                >
                  <i className="i-mgc-edit-cute-re size-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-fill-secondary"
                  title="Retry"
                >
                  <i className="i-mgc-refresh-2-cute-re size-3" />
                  <span>Retry</span>
                </button>
              </m.div>
            )}

            <div className="h-6" />
          </div>
        </m.div>

        {/* Full-width edit overlay - positioned at the top level to span entire container */}
        <AnimatePresence>
          {isEditing && (
            <m.div
              className="absolute inset-x-0 bottom-0 z-[1] flex"
              style={{
                top: dataBlockHeight > 0 ? `${dataBlockHeight}px` : 0,
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="w-full max-w-[var(--ai-chat-message-container-width,65ch)]">
                <EditableMessage
                  messageId={messageId}
                  parts={message.parts}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  className="w-full"
                  initialHeight={messageBubbleHeight}
                />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </AIMessageIdContext>
  )
})
