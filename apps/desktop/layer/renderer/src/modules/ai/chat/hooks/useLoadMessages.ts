import { use, useEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { AIChatContext } from "../__internal__/AIChatContext"
import type { BizUIMessage } from "../__internal__/types"
import { AIPersistService } from "../services"

export const useLoadMessages = (
  roomId: string,
  options?: { onLoad?: (messages: BizUIMessage[]) => void },
) => {
  const { setMessages } = use(AIChatContext)
  const setMessageEventCallback = useEventCallback((messages: BizUIMessage[]) => {
    setMessages(messages)
  })

  const [isLoading, setIsLoading] = useState(true)

  const onLoadEventCallback = useEventCallback((messages: BizUIMessage[]) => {
    options?.onLoad?.(messages)
  })

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    AIPersistService.loadMessages(roomId)
      .then((messages) => {
        if (mounted) {
          const messagesToSet = messages.map((message) => message.message) as BizUIMessage[]
          setMessageEventCallback(messagesToSet)
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
  }, [setMessageEventCallback, roomId, onLoadEventCallback])
  return { isLoading }
}
