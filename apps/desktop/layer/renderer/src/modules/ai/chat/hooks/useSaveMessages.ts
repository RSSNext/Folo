import { useEffect } from "react"

import { useChatStatus, useMessages } from "../__internal__/hooks"
import { AIPersistService } from "../services"

export const useSaveMessages = (
  chatId: string,
  options: {
    enabled: boolean
  },
) => {
  const messages = useMessages()
  const status = useChatStatus()

  const isStreaming = status === "streaming"

  useEffect(() => {
    if (!options.enabled || isStreaming) {
      return
    }

    if (!chatId) {
      return
    }

    // Skip persistence for empty chats
    if (messages.length === 0) {
      return
    }

    AIPersistService.replaceAllMessages(chatId, messages)
  }, [chatId, messages, options.enabled, isStreaming])
}
