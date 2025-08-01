import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame } from "@follow/utils"
import { springScrollTo } from "@follow/utils/scroller"
import type { BizUIMessage } from "@folo-services/ai-tools"
import type { EditorState, LexicalEditor } from "lexical"
import { nanoid } from "nanoid"
import { useCallback, useEffect, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import {
  useBlockActions,
  useChatActions,
  useChatError,
  useChatStatus,
  useCurrentChatId,
  useHasMessages,
  useMessages,
} from "~/modules/ai/chat/__internal__/hooks"
import {
  AIChatMessage,
  AIChatTypingIndicator,
} from "~/modules/ai/chat/components/message/AIChatMessage"
import { useAutoScroll } from "~/modules/ai/chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai/chat/hooks/useLoadMessages"

import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { ChatInput } from "./ChatInput"
import { WelcomeScreen } from "./WelcomeScreen"

const SCROLL_BOTTOM_THRESHOLD = 50

export const ChatInterface = () => {
  const hasMessages = useHasMessages()
  const status = useChatStatus()
  const chatActions = useChatActions()
  const error = useChatError()

  const currentChatId = useCurrentChatId()

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Reset handlers when chatId changes
  useEffect(() => {
    setIsAtBottom(true)
  }, [currentChatId])

  const { isLoading: isLoadingHistory } = useLoadMessages(currentChatId || "", {
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

  const blockActions = useBlockActions()
  const handleSendMessage = useEventCallback(
    (message: string | EditorState, editor: LexicalEditor | null) => {
      resetScrollState()

      const parts: BizUIMessage["parts"] = [
        {
          type: "data-block",
          data: blockActions.getBlocks().map((b) => ({
            type: b.type,
            value: b.value,
          })),
        },
      ]

      if (typeof message === "string") {
        parts.push({
          type: "text",
          text: message,
        })
      } else if (editor) {
        parts.push({
          type: "data-rich-text",
          data: {
            state: message.toJSON(),
            text: convertLexicalToMarkdown(editor),
          },
        })
      }

      chatActions.sendMessage({
        parts,
        role: "user",
        id: nanoid(),
      })
    },
  )

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }
  }, [status, resetScrollState])

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
                <Messages />
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

const Messages = () => {
  const messages = useMessages()

  return (
    <>
      {messages.map((message) => (
        <AIChatMessage key={message.id} message={message} />
      ))}
    </>
  )
}
