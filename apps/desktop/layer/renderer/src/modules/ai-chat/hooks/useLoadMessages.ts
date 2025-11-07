import { useEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { AIChatSessionService } from "~/modules/ai-chat-session/service"

import { AIPersistService } from "../services"
import { useChatActions } from "../store/hooks"
import type { BizUIMessage } from "../store/types"

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
    if (chatActions.get().isLocal) {
      AIPersistService.loadUIMessages(chatId)
      setIsLoading(false)

      return
    }
    let mounted = true
    setIsLoading(true)
    setIsSyncingRemote(false)
    AIChatSessionService.syncSessionMessages(chatId)
      .then(async (messages) => {
        if (!mounted) {
          return []
        }
        chatActions.setMessages(messages)
        onLoadEventCallback(messages)
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
