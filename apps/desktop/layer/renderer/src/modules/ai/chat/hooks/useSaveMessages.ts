import { use, useEffect } from "react"

import { AIChatContext } from "../__internal__/AIChatContext"
import { AIPersistService } from "../services"

export const useSaveMessages = (
  roomId: string,
  options: {
    enabled: boolean
  },
) => {
  const { messages, status } = use(AIChatContext)

  const isStreaming = status === "streaming"

  useEffect(() => {
    if (!options.enabled || isStreaming) {
      return
    }

    if (!roomId) {
      return
    }

    AIPersistService.replaceAllMessages(roomId, messages)
  }, [roomId, messages, options.enabled, isStreaming])
}
