import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { nextFrame } from "@follow/utils"
import { use, useCallback, useEffect, useRef, useState } from "react"

import {
  AIChatContext,
  useAIChatSessionMethods,
} from "~/modules/ai/chat/__internal__/AIChatContext"
import { AIChatMessage, AIChatTypingIndicator } from "~/modules/ai/chat/AIChatMessage"
import { useCurrentRoomId } from "~/modules/ai/chat/atoms/session"
import { ChatInput } from "~/modules/ai/chat/components/ChatInput"
import { WelcomeScreen } from "~/modules/ai/chat/components/WelcomeScreen"
import { useAutoScroll } from "~/modules/ai/chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai/chat/hooks/useLoadMessages"
import { useSaveMessages } from "~/modules/ai/chat/hooks/useSaveMessages"

export const ChatInterface = () => {
  const { messages, status, sendMessage } = use(AIChatContext)

  const currentRoomId = useCurrentRoomId()
  const { handleFirstMessage } = useAIChatSessionMethods()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [hasHandledFirstMessage, setHasHandledFirstMessage] = useState(false)

  // Reset handlers when roomId changes
  useEffect(() => {
    setHasHandledFirstMessage(false)
  }, [currentRoomId])

  const { isLoading: isLoadingHistory } = useLoadMessages(currentRoomId || "", {
    onLoad: () => {
      nextFrame(() => {
        const $scrollArea = scrollAreaRef.current
        const scrollHeight = $scrollArea?.scrollHeight
        if (scrollHeight) {
          $scrollArea?.scrollTo({
            top: scrollHeight,
          })
        }
      })
    },
  })
  useSaveMessages(currentRoomId || "", { enabled: !isLoadingHistory })

  const { resetScrollState } = useAutoScroll(scrollAreaRef.current, status === "streaming")

  const handleSendMessage = useCallback(
    (message: string) => {
      resetScrollState()

      // Handle first message persistence
      if (messages.length === 0 && !hasHandledFirstMessage) {
        handleFirstMessage()
        setHasHandledFirstMessage(true)
      }

      sendMessage({
        text: message,
        metadata: {
          finishTime: new Date().toISOString(),
        },
      })
    },
    [sendMessage, resetScrollState, messages.length, hasHandledFirstMessage, handleFirstMessage],
  )

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }
  }, [status, resetScrollState])

  const hasMessages = messages.length > 0

  return (
    <div className="flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {!hasMessages && !isLoadingHistory ? (
          <WelcomeScreen onSend={handleSendMessage} />
        ) : (
          <ScrollArea ref={scrollAreaRef} rootClassName="flex-1" viewportClassName="pt-12 pb-32">
            {isLoadingHistory ? (
              <div className="flex min-h-96 items-center justify-center">
                <i className="i-mgc-loading-3-cute-re text-text size-8 animate-spin" />
              </div>
            ) : (
              <div className="mx-auto max-w-4xl px-6 py-8">
                {messages.map((message) => (
                  <AIChatMessage key={message.id} message={message} />
                ))}
                {status === "submitted" && <AIChatTypingIndicator />}
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {hasMessages && <ChatInput onSend={handleSendMessage} />}
    </div>
  )
}
