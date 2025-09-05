import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { tracker } from "@follow/tracker"
import { clsx, cn, nextFrame } from "@follow/utils"
import type { BizUIMessage } from "@folo-services/ai-tools"
import { ErrorBoundary } from "@sentry/react"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence } from "motion/react"
import { nanoid } from "nanoid"
import type { FC, Ref } from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { useAISettingKey } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import {
  AIChatMessage,
  AIChatWaitingIndicator,
} from "~/modules/ai-chat/components/message/AIChatMessage"
import { UserChatMessage } from "~/modules/ai-chat/components/message/UserChatMessage"
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

import type { AIChatContextBlock } from "../../store/types"
import { convertLexicalToMarkdown } from "../../utils/lexical-markdown"
import { GlobalFileDropZone } from "../file/GlobalFileDropZone"
import { AIErrorFallback } from "./AIErrorFallback"
import { ChatInput } from "./ChatInput"
import { CollapsibleError } from "./CollapsibleError"
import { WelcomeScreen } from "./WelcomeScreen"

const SCROLL_BOTTOM_THRESHOLD = 100

const ChatInterfaceContent = ({ centerInputOnEmpty }: ChatInterfaceProps) => {
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

  usePrefetchSummary({
    entryId: mainEntryId || "",
    target: "content",
    actionLanguage,
    enabled: !!mainEntryId && !hasMessages,
  })

  const [scrollAreaRef, setScrollAreaRef] = useState<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [messageContainerMinHeight, setMessageContainerMinHeight] = useState<number | undefined>()
  const previousMinHeightRef = useRef<number>(0)
  const messagesContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsAtBottom(true)
    setMessageContainerMinHeight(undefined)
    previousMinHeightRef.current = 0
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

  const scrollHeightBeforeSendingRef = useRef<number>(0)
  const scrollContainerParentRef = useRef<HTMLDivElement | null>(null)
  const handleScrollPositioning = useEventCallback(() => {
    const $scrollContainerParent = scrollContainerParentRef.current
    if (!scrollAreaRef || !$scrollContainerParent) return

    const parentClientHeight = $scrollContainerParent.clientHeight
    // Use actual content height captured before send (messages container height), not inflated by minHeight
    const currentScrollHeight = scrollHeightBeforeSendingRef.current

    // Calculate new minimum height based on actual content height
    // Use previousMinHeightRef which tracks the real content height, not reserved space
    const baseHeight = Math.max(previousMinHeightRef.current, currentScrollHeight)
    const newMinHeight = baseHeight + parentClientHeight - 250

    setMessageContainerMinHeight(newMinHeight)

    // Scroll to the end immediately to position user message at top
    nextFrame(() => {
      scrollAreaRef.scrollTo({
        top: scrollAreaRef.scrollHeight,
        behavior: "instant",
      })
    })
  })

  const handleSendMessage = useEventCallback(
    (message: string | EditorState, editor: LexicalEditor | null) => {
      resetScrollState()

      const blocks = [] as AIChatContextBlock[]

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

      // Capture actual content height (messages container), not including reserved minHeight
      scrollHeightBeforeSendingRef.current = messagesContentRef.current?.scrollHeight ?? 0
      chatActions.sendMessage({
        parts,
        role: "user",
        id: nanoid(),
      })
      tracker.aiChatMessageSent()

      nextFrame(() => {
        // Calculate and adjust scroll positioning immediately
        handleScrollPositioning()
      })
    },
  )

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }

    // When AI response is complete, update the reference height but keep the container height unchanged
    // This avoids CLS while ensuring next calculation is based on actual content
    if (status === "ready" && scrollAreaRef && messagesContentRef.current) {
      // Update the reference to actual content height for next calculation (use messages container)
      previousMinHeightRef.current = messagesContentRef.current.scrollHeight
      // Keep the current minHeight unchanged to avoid CLS
    }
  }, [status, resetScrollState, messageContainerMinHeight, scrollAreaRef])

  const shouldShowScrollToBottom = hasMessages && !isAtBottom && !isLoadingHistory

  return (
    <GlobalFileDropZone className="@container flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col" ref={scrollContainerParentRef}>
        <AnimatePresence>
          {!hasMessages && !isLoadingHistory ? (
            <WelcomeScreen onSend={handleSendMessage} centerInputOnEmpty={centerInputOnEmpty} />
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
                <div
                  className="mx-auto w-full max-w-4xl px-6 py-8"
                  style={{
                    minHeight: messageContainerMinHeight
                      ? `${messageContainerMinHeight}px`
                      : undefined,
                  }}
                >
                  <Messages contentRef={messagesContentRef} />

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
              "center bg-mix-background/transparent-8/2 backdrop-blur-background group flex size-8 items-center gap-2 rounded-full border transition-all",
              "border-border",
              "hover:border-border/60 active:scale-[0.98]",
            )}
          >
            <i className="i-mingcute-arrow-down-line text-text/90" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "absolute mx-auto duration-500 ease-in-out",
          hasMessages && "inset-x-0 bottom-0 max-w-4xl px-6 pb-6",
          !hasMessages && "inset-x-0 bottom-0 max-w-3xl px-6 pb-6 duration-200",
          centerInputOnEmpty &&
            !hasMessages &&
            "bottom-1/2 translate-y-[calc(100%+1rem)] duration-200",
        )}
      >
        {error && <CollapsibleError error={error} />}
        <ChatInput onSend={handleSendMessage} variant={!hasMessages ? "minimal" : "default"} />
      </div>
    </GlobalFileDropZone>
  )
}

interface ChatInterfaceProps {
  centerInputOnEmpty?: boolean
}
export const ChatInterface = (props: ChatInterfaceProps) => (
  <ErrorBoundary fallback={AIErrorFallback}>
    <ChatInterfaceContent {...props} />
  </ErrorBoundary>
)

const Messages: FC<{ contentRef?: Ref<HTMLDivElement> }> = ({ contentRef }) => {
  const messages = useMessages()

  return (
    <div ref={contentRef} className="relative flex min-w-0 flex-1 flex-col">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1
        return (
          <Suspense key={message.id}>
            {message.role === "user" ? (
              <UserChatMessage message={message} />
            ) : (
              <AIChatMessage message={message} isLastMessage={isLastMessage} />
            )}
          </Suspense>
        )
      })}
    </div>
  )
}
