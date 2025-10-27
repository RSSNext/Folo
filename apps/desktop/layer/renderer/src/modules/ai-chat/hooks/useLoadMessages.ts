import { useEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { AIChatSessionService } from "~/modules/ai-chat-session/service"

import { AIPersistService } from "../services"
import { useChatActions } from "../store/hooks"
import type { BizUIMessage, BizUIMetadata } from "../store/types"

export const useLoadMessages = (
  chatId: string,
  options?: { onLoad?: (messages: BizUIMessage[]) => void },
) => {
  const chatActions = useChatActions()

  const [isLoading, setIsLoading] = useState(true)
  const [isSyncingRemote, setIsSyncingRemote] = useState(false)

  const onLoadEventCallback = useEventCallback((messages: BizUIMessage[]) => {
    options?.onLoad?.(messages)
  })

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    setIsSyncingRemote(false)
    AIPersistService.loadMessages(chatId)
      .then(async (messages) => {
        if (mounted) {
          const messagesToSet: BizUIMessage[] = messages.map((message) => ({
            id: message.id,
            parts: message.messageParts as any[],
            role: message.role,
            metadata: message.metadata as BizUIMetadata,
            createdAt: message.createdAt,
          }))
          const existingMessages = chatActions.getMessages()

          if (messagesToSet.length === 0) {
            if (existingMessages.length > 0) {
              onLoadEventCallback(existingMessages)
              return existingMessages
            }

            setIsSyncingRemote(true)
            const syncedMessages = await AIChatSessionService.syncSessionMessages(chatId)
            chatActions.setMessages(syncedMessages)
            onLoadEventCallback(syncedMessages)
            return syncedMessages
          }

          chatActions.setMessages(messagesToSet)
          onLoadEventCallback(messagesToSet)
          return messagesToSet
        }
        return messages
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false)
          setIsSyncingRemote(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [chatId, onLoadEventCallback, chatActions])
  return { isLoading, isSyncingRemote }
}
