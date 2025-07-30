import { useEffect } from "react"

import { useChatStatus, useMessages } from "../__internal__/hooks"
import { AIPersistService } from "../services"

export const useSaveMessages = (
  roomId: string,
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

    if (!roomId) {
      return
    }

    // Skip persistence for empty chats
    if (messages.length === 0) {
      return
    }

    AIPersistService.replaceAllMessages(roomId, messages)
  }, [roomId, messages, options.enabled, isStreaming])
}
