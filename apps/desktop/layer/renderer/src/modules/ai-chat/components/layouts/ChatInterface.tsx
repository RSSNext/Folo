import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { tracker } from "@follow/tracker"
import { clsx, cn, nextFrame } from "@follow/utils"
import { springScrollTo } from "@follow/utils/scroller"
import type { BizUIMessage } from "@folo-services/ai-tools"
import { ErrorBoundary } from "@sentry/react"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence } from "motion/react"
import { nanoid } from "nanoid"
import type { FC } from "react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import {
  AIChatMessage,
  AIChatWaitingIndicator,
} from "~/modules/ai-chat/components/message/AIChatMessage"
import { useAutoScroll } from "~/modules/ai-chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai-chat/hooks/useLoadMessages"
import {
  useBlockActions,
  useChatActions,
  useChatError,
  useChatStatus,
  useCurrentChatId,
  useHasMessages,
  useMessages,
} from "~/modules/ai-chat/store/hooks"

import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { GlobalFileDropZone } from "../file/GlobalFileDropZone"
import { AIErrorFallback } from "./AIErrorFallback"
import { ChatInput } from "./ChatInput"
import { CollapsibleError } from "./CollapsibleError"
import { WelcomeScreen } from "./WelcomeScreen"

const SCROLL_BOTTOM_THRESHOLD = window.innerHeight / 2

const ChatInterfaceContent = () => {
  const hasMessages = useHasMessages()
  const status = useChatStatus()
  const chatActions = useChatActions()
  const error = useChatError()

  useEffect(() => {
    if (error) {
      console.error("AIChat Error:", error)
    }
  }, [error])

  const currentChatId = useCurrentChatId()

  const [scrollAreaRef, setScrollAreaRef] = useState<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Reset handlers when chatId changes
  useEffect(() => {
    setIsAtBottom(true)
  }, [currentChatId])

  const { isLoading: isLoadingHistory } = useLoadMessages(currentChatId || "", {
    onLoad: () => {
      nextFrame(() => {
        const $scrollArea = scrollAreaRef
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

  const { resetScrollState } = useAutoScroll(scrollAreaRef, status === "streaming")

  useEffect(() => {
    const scrollElement = scrollAreaRef

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
  }, [scrollAreaRef])

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollAreaRef
    if (!scrollElement) return

    springScrollTo(scrollElement.scrollHeight, scrollElement)
  }, [scrollAreaRef])

  const blockActions = useBlockActions()
  const handleSendMessage = useEventCallback(
    (message: string | EditorState, editor: LexicalEditor | null) => {
      resetScrollState()

      const blocks = [] as any[]

      for (const block of blockActions.getBlocks()) {
        if (block.type === "fileAttachment" && block.attachment.serverUrl) {
          blocks.push({
            ...block,
            attachment: {
              id: block.attachment.id,
              name: block.attachment.name,
              type: block.attachment.type,
              size: block.attachment.size,
              serverUrl: block.attachment.serverUrl,
            },
          })
        } else {
          blocks.push(block)
        }
      }

      const parts: BizUIMessage["parts"] = [
        {
          type: "data-block",
          data: blocks,
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
            state: JSON.stringify(message.toJSON()),
            text: convertLexicalToMarkdown(editor),
          },
        })
      }

      chatActions.sendMessage({
        parts,
        role: "user",
        id: nanoid(),
      })
      tracker.aiChatMessageSent()
    },
  )

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }
  }, [status, resetScrollState])

  const shouldShowScrollToBottom = hasMessages && !isAtBottom && !isLoadingHistory

  return (
    <GlobalFileDropZone className="flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence>
          {!hasMessages && !isLoadingHistory ? (
            <WelcomeScreen onSend={handleSendMessage} />
          ) : (
            <ScrollArea
              ref={setScrollAreaRef}
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
                  {status === "submitted" && <AIChatWaitingIndicator />}
                </div>
              )}
            </ScrollArea>
          )}
        </AnimatePresence>
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
                <i className="i-mingcute-arrow-down-circle-fill text-accent size-3" />

                <span className="text-accent text-sm font-medium">Scroll to Bottom</span>
              </div>
            </button>
          </div>
        </div>
      )}

      <div
        className={clsx(
          "absolute mx-auto duration-200 ease-in-out",
          hasMessages && "inset-x-0 bottom-0 max-w-4xl px-6 pb-6",
          !hasMessages && "inset-x-0 bottom-1/2 max-w-3xl translate-y-[calc(100%-2rem)] px-6 pb-6",
        )}
      >
        {error && <CollapsibleError error={error} />}
        <ChatInput onSend={handleSendMessage} variant={!hasMessages ? "minimal" : "default"} />
      </div>
    </GlobalFileDropZone>
  )
}

export const ChatInterface = () => (
  <ErrorBoundary fallback={AIErrorFallback}>
    <ChatInterfaceContent />
  </ErrorBoundary>
)

const Messages: FC = () => {
  const messages = useMessages()

  return messages.map((message) => (
    <Suspense key={message.id}>
      <AIChatMessage message={message} />
    </Suspense>
  ))
}
