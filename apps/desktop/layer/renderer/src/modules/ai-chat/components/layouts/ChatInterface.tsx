import { useFocusable } from "@follow/components/common/Focusable/hooks.js"
import {
  convertLexicalToMarkdown,
  getEditorStateJSONString,
} from "@follow/components/ui/lexical-rich-editor/utils.js"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { tracker } from "@follow/tracker"
import { detectIsEditableElement, nextFrame } from "@follow/utils"
import { ErrorBoundary } from "@sentry/react"
import type { EditorState } from "lexical"
import { createEditor } from "lexical"
import { nanoid } from "nanoid"
import { use, useEffect, useMemo, useRef, useState } from "react"
import { useEventCallback, useEventListener } from "usehooks-ts"

import { useAISettingKey } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
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

import { LexicalAIEditorNodes } from "../../editor"
import { useAIConfiguration } from "../../hooks/useAIConfiguration"
import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { AIPanelRefsContext } from "../../store/AIChatContext"
import type { AIChatContextBlock, BizUIMessage, SendingUIMessage } from "../../store/types"
import { computeIsRateLimited, computeRateLimitMessage } from "../../utils/rate-limit"
import { GlobalFileDropZone } from "../file/GlobalFileDropZone"
import { AIErrorFallback } from "./AIErrorFallback"
import { ChatBottomPanel } from "./ChatBottomPanel"
import { ChatMessageContainer } from "./ChatMessageContainer"

const draftMessages = new Map<string, EditorState>()
const ChatInterfaceContent = ({ centerInputOnEmpty }: ChatInterfaceProps) => {
  const hasMessages = useHasMessages()
  const status = useChatStatus()
  const chatActions = useChatActions()
  const error = useChatError()
  const messages = useMessages()

  useAutoTimelineSummaryShortcut()

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
  const [messageContainerMinHeight, setMessageContainerMinHeight] = useState<number | undefined>()
  const previousMinHeightRef = useRef<number>(0)
  const messagesContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
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
      })
    },
  })

  const autoScrollWhenStreaming = useAISettingKey("autoScrollWhenStreaming")

  const { shouldShowInterruptionNotice, lastUserMessage } = useMemo(() => {
    if (messages.length === 0) {
      return {
        shouldShowInterruptionNotice: false,
        lastUserMessage: null as BizUIMessage | null,
      }
    }

    const lastMessage = messages.at(-1)!

    const shouldShow =
      lastMessage.role === "user" &&
      status !== "streaming" &&
      status !== "error" &&
      status !== "submitted"

    return {
      shouldShowInterruptionNotice: shouldShow,
      lastUserMessage: shouldShow ? lastMessage : null,
    }
  }, [messages, status])

  const { resetScrollState } = useAutoScroll(
    scrollAreaRef,
    autoScrollWhenStreaming && status === "streaming",
  )

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

  const handleRetryLastMessage = useEventCallback(() => {
    if (!lastUserMessage) {
      return
    }

    resetScrollState()

    const clonedMessage = structuredClone(lastUserMessage)
    const { createdAt: _createdAt, id: _originalId, ...rest } = clonedMessage
    const retryMessage: SendingUIMessage = {
      ...(rest as Omit<SendingUIMessage, "id">),
      id: nanoid(),
    }

    scrollHeightBeforeSendingRef.current = messagesContentRef.current?.scrollHeight ?? 0

    chatActions.popMessage()
    void chatActions.sendMessage(retryMessage)
    tracker.aiChatMessageSent()

    nextFrame(() => {
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

  const { handleScroll } = useAttachScrollBeyond()

  const { data: configuration } = useAIConfiguration()

  const isRateLimited = useMemo(
    () => computeIsRateLimited(error, configuration),
    [error, configuration],
  )

  const rateLimitMessage = useMemo(
    () => computeRateLimitMessage(error, configuration),
    [error, configuration],
  )

  return (
    <div className="flex size-full flex-col @container">
      <GlobalFileDropZone className="flex size-full flex-col @container">
        <div className="flex min-h-0 flex-1 flex-col" ref={scrollContainerParentRef}>
          <ChatMessageContainer
            currentChatId={currentChatId}
            hasMessages={hasMessages}
            isLoadingHistory={isLoadingHistory}
            isSyncingRemote={isSyncingRemote}
            bottomPanelHeight={bottomPanelHeight}
            messageContainerMinHeight={messageContainerMinHeight}
            messagesContentRef={messagesContentRef}
            onScroll={handleScroll}
            setScrollAreaRef={setScrollAreaRef}
            status={status}
            centerInputOnEmpty={centerInputOnEmpty}
            onScrollToBottom={resetScrollState}
          />
        </div>

        <ChatBottomPanel
          hasMessages={hasMessages}
          centerInputOnEmpty={centerInputOnEmpty}
          shouldShowInterruptionNotice={shouldShowInterruptionNotice}
          rateLimitMessage={rateLimitMessage}
          isRateLimited={isRateLimited}
          onRetryLastMessage={handleRetryLastMessage}
          onSendMessage={handleSendMessage}
          initialDraftState={initialDraft}
          onDraftChange={handleDraftChange}
          onHeightChange={setBottomPanelHeight}
        />
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
