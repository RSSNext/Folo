import { useFocusable } from "@follow/components/common/Focusable/hooks.js"
import {
  convertLexicalToMarkdown,
  getEditorStateJSONString,
} from "@follow/components/ui/lexical-rich-editor/utils.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { useElementWidth } from "@follow/hooks"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { tracker } from "@follow/tracker"
import { clsx, cn, detectIsEditableElement, nextFrame } from "@follow/utils"
import { ErrorBoundary } from "@sentry/react"
import type { EditorState } from "lexical"
import { $createParagraphNode, $getRoot, createEditor } from "lexical"
import { AnimatePresence } from "motion/react"
import { nanoid } from "nanoid"
import type { FC, RefObject } from "react"
import * as React from "react"
import { Suspense, use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useEventCallback, useEventListener } from "usehooks-ts"

import { useAISettingKey } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import {
  AIChatMessage,
  AIChatWaitingIndicator,
} from "~/modules/ai-chat/components/message/AIChatMessage"
import { ErrorMessage } from "~/modules/ai-chat/components/message/ErrorMessage"
import { UserChatMessage } from "~/modules/ai-chat/components/message/UserChatMessage"
import { useAutoScroll } from "~/modules/ai-chat/hooks/useAutoScroll"
import { useAutoTimelineSummaryShortcut } from "~/modules/ai-chat/hooks/useAutoTimelineSummaryShortcut"
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

import { LexicalAIEditorNodes, ShortcutNode } from "../../editor"
import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { AIPanelRefsContext } from "../../store/AIChatContext"
import type { AIChatContextBlock, BizUIMessage, SendingUIMessage } from "../../store/types"
import { isRateLimitError } from "../../utils/error"
import { GlobalFileDropZone } from "../file/GlobalFileDropZone"
import { AIErrorFallback } from "./AIErrorFallback"
import { ChatInput } from "./ChatInput"
import { ChatShortcutsRow } from "./ChatShortcutsRow"
import { RateLimitNotice } from "./RateLimitNotice"
import { WelcomeScreen } from "./WelcomeScreen"

const SCROLL_BOTTOM_THRESHOLD = 100

const draftMessages = new Map<string, EditorState>()
const ChatInterfaceContent = ({ centerInputOnEmpty }: ChatInterfaceProps) => {
  const hasMessages = useHasMessages()
  const status = useChatStatus()
  const chatActions = useChatActions()
  const error = useChatError()

  useAutoTimelineSummaryShortcut()

  const isFocusWithIn = useFocusable()

  const aiPanelRefs = use(AIPanelRefsContext)

  // Store draft messages for each chatId in memory during browser session

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

  const { isLoading: isLoadingHistory, isSyncingRemote } = useLoadMessages(currentChatId || "", {
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

  const staticEditor = useMemo(() => {
    return createEditor({
      nodes: LexicalAIEditorNodes,
    })
  }, [])

  const handleSendMessage = useEventCallback((message: string | EditorState) => {
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
        data: blocks.filter((block) => !block.disabled),
      },
    ]

    if (typeof message === "string") {
      parts.push({
        type: "data-rich-text",
        data: {
          state: getEditorStateJSONString(message),
          text: message,
        },
      })
    } else {
      staticEditor.setEditorState(message)
      parts.push({
        type: "data-rich-text",
        data: {
          state: JSON.stringify(message.toJSON()),
          text: convertLexicalToMarkdown(staticEditor),
        },
      })
    }

    // Capture actual content height (messages container), not including reserved minHeight
    scrollHeightBeforeSendingRef.current = messagesContentRef.current?.scrollHeight ?? 0
    const sendMessage: SendingUIMessage = {
      parts,
      role: "user",
      id: nanoid(),
    }
    chatActions.sendMessage(sendMessage)
    tracker.aiChatMessageSent()

    // Clear draft message after sending
    if (currentChatId) {
      draftMessages.delete(currentChatId)
    }

    nextFrame(() => {
      // Calculate and adjust scroll positioning immediately
      handleScrollPositioning()
    })
  })

  // Save draft message when input changes
  const handleDraftChange = useEventCallback((editorState: EditorState) => {
    if (currentChatId) {
      draftMessages.set(currentChatId, editorState)
    }
  })

  // Get initial draft message for current chat
  const initialDraft = currentChatId ? draftMessages.get(currentChatId) : undefined

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
  const shouldShowLoadingOverlay =
    Boolean(currentChatId) && !hasMessages && (isLoadingHistory || isSyncingRemote)

  const { handleScroll } = useAttachScrollBeyond()

  // Check if error is a rate limit error
  const hasRateLimitError = useMemo(() => isRateLimitError(error), [error])

  // Additional height for rate limit notice (~40px)
  const rateLimitExtraHeight = hasRateLimitError ? 40 : 0

  return (
    <div className="flex size-full flex-col @container">
      <GlobalFileDropZone className="flex size-full flex-col @container">
        <div className="flex min-h-0 flex-1 flex-col" ref={scrollContainerParentRef}>
          <AnimatePresence>
            {!hasMessages && !shouldShowLoadingOverlay ? (
              <WelcomeScreen centerInputOnEmpty={centerInputOnEmpty} />
            ) : (
              <>
                {shouldShowLoadingOverlay ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex -translate-y-24 flex-col items-center space-y-2">
                      <i className="i-mgc-loading-3-cute-re size-8 animate-spin text-text" />
                      {isSyncingRemote && (
                        <p className="text-sm text-text-secondary">
                          Syncing messages from server...
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
                <ScrollArea
                  onScroll={handleScroll}
                  flex
                  scrollbarClassName="mt-12"
                  scrollbarProps={{
                    style: {
                      marginBottom: Math.max(160, bottomPanelHeight) + rateLimitExtraHeight,
                    },
                  }}
                  ref={setScrollAreaRef}
                  rootClassName="flex-1"
                  viewportProps={{
                    style: {
                      paddingBottom: Math.max(128, bottomPanelHeight) + rateLimitExtraHeight,
                    },
                  }}
                  viewportClassName={"pt-12"}
                >
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
                </ScrollArea>
              </>
            )}
          </AnimatePresence>
        </div>

        {shouldShowScrollToBottom && (
          <div
            className={clsx("absolute right-1/2 z-40 translate-x-1/2", "bottom-48 -translate-y-2")}
          >
            <button
              type="button"
              onClick={() => resetScrollState()}
              className={cn(
                "group center flex size-8 items-center gap-2 rounded-full border backdrop-blur-background transition-all bg-mix-background/transparent-8/2",
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
          data-testid="chat-input-container"
          className={cn(
            "absolute z-10 mx-auto duration-500 ease-in-out",
            hasMessages && "inset-x-0 bottom-0 max-w-4xl px-4 pb-4",
            !hasMessages && "inset-x-0 bottom-0 max-w-3xl px-4 pb-4 duration-200",
            centerInputOnEmpty &&
              !hasMessages &&
              "bottom-1/2 translate-y-[calc(100%+1rem)] duration-200",
          )}
        >
          {hasRateLimitError && error && <RateLimitNotice error={error} />}
          <ChatShortcutsRow
            onSelect={(shortcutData) => {
              const tempEditor = createEditor({
                nodes: LexicalAIEditorNodes,
              })

              tempEditor.update(
                () => {
                  const root = $getRoot()
                  root.clear()
                  const paragraph = $createParagraphNode()
                  const shortcutNode = new ShortcutNode(shortcutData)
                  paragraph.append(shortcutNode)
                  root.append(paragraph)
                },
                {
                  discrete: true,
                },
              )

              const editorState = tempEditor.getEditorState()
              handleSendMessage(editorState)
            }}
          />
          <ChatInput
            onSend={handleSendMessage}
            variant={!hasMessages ? "minimal" : "default"}
            initialDraftState={initialDraft}
            onEditorStateChange={handleDraftChange}
          />

          {(!centerInputOnEmpty || hasMessages) && (
            <div className="absolute inset-x-0 bottom-0 isolate">
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-44 backdrop-blur-xl backdrop-brightness-110 dark:backdrop-brightness-75"
                style={{
                  maskImage:
                    "linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.6) 25%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.6) 25%, transparent)",
                }}
              />

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-b from-background/20 to-background/0"
                style={{
                  maskImage: "linear-gradient(to top, black 20%, transparent 70%)",
                  WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 70%)",
                  backdropFilter: "blur(50px) saturate(130%)",
                  WebkitBackdropFilter: "blur(50px) saturate(130%)",
                }}
              />
            </div>
          )}
        </div>
      </GlobalFileDropZone>
    </div>
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

export const Messages: FC<{ contentRef?: RefObject<HTMLDivElement> }> = ({ contentRef }) => {
  const messages = useMessages()
  const error = useChatError()
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
      {/* Render error as the last message in the list */}
      {!!messageContainerWidth && error && <ErrorMessage error={error} />}
    </div>
  )
}
