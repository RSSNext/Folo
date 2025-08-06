import { useEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { AIPersistService } from "../services"
import { useChatActions } from "../store/hooks"
import type { BizUIMessage, BizUIMetadata } from "../store/types"

export const useLoadMessages = (
  chatId: string,
  options?: { onLoad?: (messages: BizUIMessage[]) => void },
) => {
  const chatActions = useChatActions()

  const [isLoading, setIsLoading] = useState(true)

  const onLoadEventCallback = useEventCallback((messages: BizUIMessage[]) => {
    options?.onLoad?.(messages)
  })

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    AIPersistService.loadMessages(chatId)
      .then((messages) => {
        if (mounted) {
          const messagesToSet: BizUIMessage[] = messages.map((message) => ({
            id: message.id,
            parts: message.messageParts as any[],
            role: message.role,
            metadata: message.metadata as BizUIMetadata,
          }))
          chatActions.setMessages(messagesToSet)
          onLoadEventCallback(messagesToSet)
        }
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [chatId, onLoadEventCallback, chatActions])
  return { isLoading }
}
