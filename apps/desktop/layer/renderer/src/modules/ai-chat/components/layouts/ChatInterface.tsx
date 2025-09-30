import { useFocusable } from "@follow/components/common/Focusable/hooks.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { useElementWidth } from "@follow/hooks"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { tracker } from "@follow/tracker"
import { clsx, cn, detectIsEditableElement, nextFrame } from "@follow/utils"
import type { BizUIMessage } from "@folo-services/ai-tools"
import { ErrorBoundary } from "@sentry/react"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence } from "motion/react"
import { nanoid } from "nanoid"
import type { FC, RefObject } from "react"
import { Suspense, use, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useEventCallback, useEventListener } from "usehooks-ts"

import { useAISettingKey } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
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

import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { AIPanelRefsContext } from "../../store/AIChatContext"
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

  const isFocusWithIn = useFocusable()

  const aiPanelRefs = use(AIPanelRefsContext)

  useEventListener("keydown", (e) => {
    if (isFocusWithIn) {
      const currentActiveElement = document.activeElement

      if (detectIsEditableElement(currentActiveElement as HTMLElement)) {
        return
      }

      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        return
      }
      aiPanelRefs.inputRef?.current?.focus()
    }
  })

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
        } else if (block.type === "mainFeed" && block.value.startsWith(ROUTE_FEED_IN_FOLDER)) {
          const categoryName = block.value.slice(ROUTE_FEED_IN_FOLDER.length)
          const { view } = getRouteParams()
          const feedIds = getCategoryFeedIds(categoryName, view)
          blocks.push({
            ...block,
            value: feedIds.join(","),
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

  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(0)
  const bottomPanelRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!bottomPanelRef.current) {
      return
    }
    setBottomPanelHeight(bottomPanelRef.current.offsetHeight)

    const resizeObserver = new ResizeObserver(() => {
      if (!bottomPanelRef.current) {
        return
      }
      setBottomPanelHeight(bottomPanelRef.current.offsetHeight)
    })
    resizeObserver.observe(bottomPanelRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

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

  const { handleScroll } = useAttachScrollBeyond()
  return (
    <GlobalFileDropZone className="@container flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col" ref={scrollContainerParentRef}>
        <AnimatePresence>
          {!hasMessages && !isLoadingHistory ? (
            <WelcomeScreen onSend={handleSendMessage} centerInputOnEmpty={centerInputOnEmpty} />
          ) : (
            <>
              <ScrollArea
                onScroll={handleScroll}
                flex
                scrollbarClassName="mt-12"
                scrollbarProps={{
                  style: {
                    marginBottom: Math.max(160, bottomPanelHeight) + (error ? 64 : 0),
                  },
                }}
                ref={setScrollAreaRef}
                rootClassName="flex-1"
                viewportProps={{
                  style: {
                    paddingBottom: Math.max(128, bottomPanelHeight) + (error ? 64 : 0),
                  },
                }}
                viewportClassName={"pt-12"}
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
                    <Messages contentRef={messagesContentRef as RefObject<HTMLDivElement>} />

                    {(status === "submitted" || status === "streaming") && (
                      <AIChatWaitingIndicator />
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
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
        ref={bottomPanelRef}
        className={cn(
          "absolute z-10 mx-auto duration-500 ease-in-out",
          hasMessages && "inset-x-0 bottom-0 max-w-4xl px-6 pb-6",
          !hasMessages && "inset-x-0 bottom-0 max-w-3xl px-6 pb-6 duration-200",
          centerInputOnEmpty &&
            !hasMessages &&
            "bottom-1/2 translate-y-[calc(100%+1rem)] duration-200",
        )}
      >
        {error && <CollapsibleError error={error} />}
        <ChatInput onSend={handleSendMessage} variant={!hasMessages ? "minimal" : "default"} />
        <div className="text-text-secondary relative z-[1] -mb-4 mt-2 pl-2 text-xs">
          AI can make mistakes, please verify critical information.
        </div>

        {(!centerInputOnEmpty || hasMessages) && (
          <div
            className="bg-background pointer-events-none absolute inset-x-0 bottom-0 z-0 opacity-90"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, black)",
              height: bottomPanelHeight,
            }}
          />
        )}
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

const Messages: FC<{ contentRef?: RefObject<HTMLDivElement> }> = ({ contentRef }) => {
  const messages = useMessages()
  const fallbackRef = useRef<HTMLDivElement>(null)
  const messageContainerWidth = useElementWidth(contentRef ?? fallbackRef)
  return (
    <div
      ref={contentRef}
      className="relative flex min-w-0 flex-1 flex-col"
      style={
        {
          "--ai-chat-message-container-width": `${messageContainerWidth}px`,
        } as React.CSSProperties
      }
    >
      {!!messageContainerWidth &&
        messages.map((message, index) => {
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
