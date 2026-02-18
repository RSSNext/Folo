import { useFocusable } from "@follow/components/common/Focusable/hooks.js"
import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/types.js"
import {
  convertLexicalToMarkdown,
  getEditorStateJSONString,
} from "@follow/components/ui/lexical-rich-editor/utils.js"
import { isFreeRole } from "@follow/constants"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { useUserRole } from "@follow/store/user/hooks"
import { tracker } from "@follow/tracker"
import { detectIsEditableElement, nextFrame } from "@follow/utils"
import type { ConfigResponse } from "@follow-app/client-sdk"
import type { EditorState } from "lexical"
import { createEditor } from "lexical"
import { nanoid } from "nanoid"
import type { RefObject } from "react"
import { use, useEffect, useMemo, useRef, useState } from "react"
import { useEventCallback, useEventListener } from "usehooks-ts"

import { useAISettingKey } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { ErrorBoundary } from "~/components/common/ErrorBoundary"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useRequireLogin } from "~/hooks/common/useRequireLogin"
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

import { LexicalAIEditorNodes } from "../../editor"
import { useAIConfiguration } from "../../hooks/useAIConfiguration"
import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { AIPanelRefsContext } from "../../store/AIChatContext"
import type { AIChatContextBlock, BizUIMessage, SendingUIMessage } from "../../store/types"
import { computeIsRateLimited, computeRateLimitMessage } from "../../utils/rate-limit"
import {
  extractShortcutIdFromMessageParts,
  extractShortcutIdFromSerializedState,
  prefixMessageIdWithShortcut,
} from "../../utils/shortcut"
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
  const { ensureLogin } = useRequireLogin()
  const userRole = useUserRole()

  const isFocusWithin = useFocusable()

  const aiPanelRefs = use(AIPanelRefsContext)

  useChatInputFocusHandler(isFocusWithin, aiPanelRefs.inputRef)
  useLogChatError(error)

  const currentChatId = useCurrentChatId()
  const mainEntryId = useMainEntryId()
  const actionLanguage = useActionLanguage()

  usePrefetchSummary({
    entryId: mainEntryId || "",
    target: "content",
    actionLanguage,
    enabled: !!mainEntryId && !hasMessages,
  })

  const {
    scrollAreaRef,
    setScrollAreaRef,
    messageContainerMinHeight,
    messagesContentRef,
    scrollContainerParentRef,
    captureContentHeightBeforeSend,
    handleScrollPositioning,
    updateContentHeightSnapshot,
  } = useChatScroller(currentChatId)

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

  const { shouldShowInterruptionNotice, lastUserMessage } = useInterruptionNotice(messages, status)

  const { resetScrollState } = useAutoScroll(
    scrollAreaRef,
    autoScrollWhenStreaming && status === "streaming",
  )

  const blockActions = useBlockActions()

  const staticEditor = useMemo(() => {
    return createEditor({
      nodes: LexicalAIEditorNodes,
    })
  }, [])

  const handleSendMessage = useEventCallback((message: string | EditorState) => {
    if (!ensureLogin()) {
      return
    }
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

    let shortcutIdFromMessage: string | undefined

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
      const serializedState = message.toJSON()
      shortcutIdFromMessage = extractShortcutIdFromSerializedState(serializedState)
      parts.push({
        type: "data-rich-text",
        data: {
          state: JSON.stringify(serializedState),
          text: convertLexicalToMarkdown(staticEditor),
        },
      })
    }

    captureContentHeightBeforeSend()
    const messageId = prefixMessageIdWithShortcut(nanoid(), shortcutIdFromMessage)
    const sendMessage: SendingUIMessage = {
      parts,
      role: "user",
      id: messageId,
    }
    chatActions.sendMessage(sendMessage)
    tracker.aiChatMessageSent()

    // Clear draft message after sending
    clearDraft()

    nextFrame(() => {
      // Calculate and adjust scroll positioning immediately
      handleScrollPositioning()
    })
  })

  const handleRetryLastMessage = useEventCallback(() => {
    if (!ensureLogin()) {
      return
    }
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
    const retryShortcutId = extractShortcutIdFromMessageParts(retryMessage.parts)
    retryMessage.id = prefixMessageIdWithShortcut(retryMessage.id, retryShortcutId)

    captureContentHeightBeforeSend()

    chatActions.popMessage()
    void chatActions.sendMessage(retryMessage)
    tracker.aiChatMessageSent()

    nextFrame(() => {
      handleScrollPositioning()
    })
  })

  const { handleDraftChange, initialDraft, clearDraft } = useChatDraft(currentChatId)

  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(0)

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }

    // When AI response is complete, update the reference height but keep the container height unchanged
    // This avoids CLS while ensuring next calculation is based on actual content
    if (status === "ready" && scrollAreaRef && messagesContentRef.current) {
      // Update the reference to actual content height for next calculation (use messages container)
      updateContentHeightSnapshot()
      // Keep the current minHeight unchanged to avoid CLS
    }
  }, [status, resetScrollState, scrollAreaRef, updateContentHeightSnapshot, messagesContentRef])

  const { handleScroll } = useAttachScrollBeyond()

  const { data: configuration } = useAIConfiguration()
  const shouldHideResetDetails = userRole ? isFreeRole(userRole) : false

  const { isRateLimited, rateLimitMessage } = useRateLimitInfo(
    error,
    configuration,
    shouldHideResetDetails,
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

const useChatInputFocusHandler = (
  isFocusWithin: boolean,
  inputRef?: RefObject<LexicalRichEditorRef>,
) => {
  useEventListener("keydown", (event) => {
    if (!isFocusWithin) {
      return
    }
    const currentActiveElement = document.activeElement

    if (detectIsEditableElement(currentActiveElement as HTMLElement)) {
      return
    }

    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      return
    }

    inputRef?.current?.focus()
  })
}

const useLogChatError = (error: unknown) => {
  useEffect(() => {
    if (error) {
      console.error("AIChat Error:", error)
    }
  }, [error])
}

const useInterruptionNotice = (
  messages: BizUIMessage[],
  status: ReturnType<typeof useChatStatus>,
) => {
  return useMemo(() => {
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
}

const useChatDraft = (currentChatId?: string | null) => {
  const handleDraftChange = useEventCallback((editorState: EditorState) => {
    if (currentChatId) {
      draftMessages.set(currentChatId, editorState)
    }
  })

  const clearDraft = useEventCallback(() => {
    if (currentChatId) {
      draftMessages.delete(currentChatId)
    }
  })

  const initialDraft = currentChatId ? draftMessages.get(currentChatId) : undefined

  return {
    handleDraftChange,
    initialDraft,
    clearDraft,
  }
}

const useRateLimitInfo = (
  error: Error | string | undefined,
  configuration: ConfigResponse | undefined,
  shouldHideResetDetails: boolean,
) => {
  const isRateLimited = useMemo(
    () => computeIsRateLimited(error, configuration),
    [error, configuration],
  )

  const rateLimitMessage = useMemo(
    () =>
      computeRateLimitMessage(error, configuration, {
        hideResetDetails: shouldHideResetDetails,
      }),
    [error, configuration, shouldHideResetDetails],
  )

  return {
    isRateLimited,
    rateLimitMessage,
  }
}

const useChatScroller = (currentChatId?: string | null) => {
  const [scrollAreaRef, setScrollAreaRef] = useState<HTMLDivElement | null>(null)
  const [messageContainerMinHeight, setMessageContainerMinHeight] = useState<number | undefined>()
  const messagesContentRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerParentRef = useRef<HTMLDivElement | null>(null)
  const scrollHeightBeforeSendingRef = useRef<number>(0)
  const previousMinHeightRef = useRef<number>(0)

  useEffect(() => {
    setMessageContainerMinHeight(undefined)
    previousMinHeightRef.current = 0
  }, [currentChatId])

  const captureContentHeightBeforeSend = useEventCallback(() => {
    scrollHeightBeforeSendingRef.current = messagesContentRef.current?.scrollHeight ?? 0
  })

  const handleScrollPositioning = useEventCallback(() => {
    const $scrollContainerParent = scrollContainerParentRef.current
    if (!scrollAreaRef || !$scrollContainerParent) return

    const parentClientHeight = $scrollContainerParent.clientHeight
    const currentScrollHeight = scrollHeightBeforeSendingRef.current
    const baseHeight = Math.max(previousMinHeightRef.current, currentScrollHeight)
    const newMinHeight = baseHeight + parentClientHeight - 250

    setMessageContainerMinHeight(newMinHeight)

    nextFrame(() => {
      scrollAreaRef.scrollTo({
        top: scrollAreaRef.scrollHeight,
        behavior: "instant",
      })
    })
  })

  const updateContentHeightSnapshot = useEventCallback(() => {
    if (scrollAreaRef && messagesContentRef.current) {
      previousMinHeightRef.current = messagesContentRef.current.scrollHeight
    }
  })

  return {
    scrollAreaRef,
    setScrollAreaRef,
    messageContainerMinHeight,
    messagesContentRef,
    scrollContainerParentRef,
    captureContentHeightBeforeSend,
    handleScrollPositioning,
    updateContentHeightSnapshot,
  }
}
