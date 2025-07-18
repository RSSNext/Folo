import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame } from "@follow/utils"
import { springScrollTo } from "@follow/utils/scroller"
import { use, useCallback, useEffect, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import {
  AIChatContext,
  useAIChatSessionMethods,
} from "~/modules/ai/chat/__internal__/AIChatContext"
import { useCurrentRoomId } from "~/modules/ai/chat/atoms/session"
import { ChatInput } from "~/modules/ai/chat/components/ChatInput"
import {
  AIChatMessage,
  AIChatTypingIndicator,
} from "~/modules/ai/chat/components/message/AIChatMessage"
import { WelcomeScreen } from "~/modules/ai/chat/components/WelcomeScreen"
import { useAutoScroll } from "~/modules/ai/chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai/chat/hooks/useLoadMessages"
import { useSaveMessages } from "~/modules/ai/chat/hooks/useSaveMessages"

const SCROLL_BOTTOM_THRESHOLD = 50

export const ChatInterface = () => {
  const { messages, status, sendMessage, error } = use(AIChatContext)

  const currentRoomId = useCurrentRoomId()

  const { handleFirstMessage } = useAIChatSessionMethods()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [hasHandledFirstMessage, setHasHandledFirstMessage] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Reset handlers when roomId changes
  useEffect(() => {
    setHasHandledFirstMessage(false)
    setIsAtBottom(true)
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
        setIsAtBottom(true)
      })
    },
  })
  useSaveMessages(currentRoomId || "", { enabled: !isLoadingHistory })

  const { resetScrollState } = useAutoScroll(scrollAreaRef.current, status === "streaming")

  useEffect(() => {
    const scrollElement = scrollAreaRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const atBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD
      setIsAtBottom(atBottom)
    }

    scrollElement.addEventListener("scroll", handleScroll, { passive: true })

    handleScroll()

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollAreaRef.current
    if (!scrollElement) return

    springScrollTo(scrollElement.scrollHeight, scrollElement)
  }, [])

  const handleSendMessage = useEventCallback((message: string) => {
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
  })

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }
  }, [status, resetScrollState])

  const hasMessages = messages.length > 0

  const shouldShowScrollToBottom = hasMessages && !isAtBottom && !isLoadingHistory

  return (
    <div className="flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {!hasMessages && !isLoadingHistory ? (
          <WelcomeScreen onSend={handleSendMessage} />
        ) : (
          <ScrollArea
            ref={scrollAreaRef}
            rootClassName="flex-1"
            viewportClassName={cn("pt-12 pb-32", error && "pb-48")}
          >
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

      {shouldShowScrollToBottom && (
        <div className="absolute inset-x-0 bottom-32 z-10">
          <div className="mx-auto max-w-[300px] p-6 pb-3">
            <button
              type="button"
              onClick={scrollToBottom}
              className="bg-accent/10 border-accent/20 shadow-accent/5 dark:shadow-accent/10 hover:bg-accent/15 backdrop-blur-background group relative w-full overflow-hidden rounded-xl border shadow-lg transition-colors"
            >
              {/* Glass effect overlay */}
              <div className="from-accent/5 absolute inset-0 bg-gradient-to-r to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-2 p-3">
                <i className="i-mingcute-arrow-down-circle-fill text-blue size-3" />

                <span className="text-blue text-sm font-medium">Scroll to Bottom</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {hasMessages && (
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl p-6">
          <ChatInput onSend={handleSendMessage} />
        </div>
      )}
    </div>
  )
}
