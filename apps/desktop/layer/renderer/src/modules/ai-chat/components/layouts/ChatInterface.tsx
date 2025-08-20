import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { tracker } from "@follow/tracker"
import { clsx, cn, nextFrame } from "@follow/utils"
import type { BizUIMessage } from "@folo-services/ai-tools"
import { ErrorBoundary } from "@sentry/react"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence } from "motion/react"
import { nanoid } from "nanoid"
import type { FC } from "react"
import { Suspense, useEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { useAISettingKey } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import {
  AIChatMessage,
  AIChatWaitingIndicator,
} from "~/modules/ai-chat/components/message/AIChatMessage"
import { useAutoScroll } from "~/modules/ai-chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai-chat/hooks/useLoadMessages"
import { useMainEntryId } from "~/modules/ai-chat/hooks/useMainEntryId"
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

const SCROLL_BOTTOM_THRESHOLD = 100

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
  const mainEntryId = useMainEntryId()
  const actionLanguage = useActionLanguage()

  // Prefetch summary for context-aware welcome screen
  usePrefetchSummary({
    entryId: mainEntryId || "",
    target: "content", // Start with content, fallback to readability if needed
    actionLanguage,
    enabled: !!mainEntryId && !hasMessages, // Only when showing welcome screen
  })

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

  const autoScrollWhenStreaming = useAISettingKey("autoScrollWhenStreaming")

  const { resetScrollState } = useAutoScroll(
    scrollAreaRef,
    autoScrollWhenStreaming && status === "streaming",
  )

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
              flex
              scrollbarClassName="mb-40 mt-12"
              ref={setScrollAreaRef}
              rootClassName="flex-1"
              viewportClassName={cn("pt-12 pb-32", error && "pb-48")}
            >
              {isLoadingHistory ? (
                <div className="flex min-h-96 items-center justify-center">
                  <i className="i-mgc-loading-3-cute-re text-text size-8 animate-spin" />
                </div>
              ) : (
                <div className="mx-auto w-full max-w-4xl px-6 py-8">
                  <Messages />

                  {(status === "submitted" || status === "streaming") && <AIChatWaitingIndicator />}
                </div>
              )}
            </ScrollArea>
          )}
        </AnimatePresence>
      </div>

      {shouldShowScrollToBottom && (
        <div className={clsx("absolute right-1/2 z-40 translate-x-1/2", "bottom-44")}>
          <button
            type="button"
            onClick={() => resetScrollState()}
            className={cn(
              "backdrop-blur-background group flex items-center gap-2 rounded-full border px-3.5 py-2 transition-all",
              "border-border/40 bg-material-ultra-thin shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]",
              "hover:bg-material-medium hover:border-border/60 active:scale-[0.98]",
            )}
          >
            <i className="i-mingcute-arrow-down-line text-text/90 size-3" />
            <span className="text-text/90 text-[13px] font-medium">Scroll to Bottom</span>
          </button>
        </div>
      )}

      <div
        className={clsx(
          "absolute mx-auto duration-200 ease-in-out",
          hasMessages && "inset-x-0 bottom-0 max-w-4xl px-6 pb-6",
          !hasMessages && "inset-x-0 bottom-0 max-w-3xl px-6 pb-6",
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

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      {messages.map((message) => (
        <Suspense key={message.id}>
          <AIChatMessage message={message} />
        </Suspense>
      ))}
    </div>
  )
}
