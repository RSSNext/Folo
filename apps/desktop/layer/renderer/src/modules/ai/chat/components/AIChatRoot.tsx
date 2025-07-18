import { Chat, useChat } from "@ai-sdk/react"
import { env } from "@follow/shared/env.desktop"
import type { UIDataTypes, UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import type { FC, PropsWithChildren } from "react"
import { useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"
import { useEventCallback } from "usehooks-ts"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import type { AIChatSessionMethods, AIPanelRefs } from "../__internal__/AIChatContext"
import {
  AIChatContext,
  AIChatContextStoreContext,
  AIChatSessionMethodsContext,
  AIPanelRefsContext,
} from "../__internal__/AIChatContext"
import { createAIChatContextStore } from "../__internal__/store"
import type { BizUIMetadata, BizUITools } from "../__internal__/types"
import {
  useCurrentRoomId,
  useSessionPersisted,
  useSetCurrentRoomId,
  useSetCurrentTitle,
  useSetSessionPersisted,
} from "../atoms/session"
import { useChatHistory } from "../hooks/useChatHistory"
import { AIPersistService } from "../services"
import { generateChatTitle } from "../utils/titleGeneration"

interface AIChatRootProps extends PropsWithChildren {
  wrapFocusable?: boolean
  roomId?: string
}

export const AIChatRoot: FC<AIChatRootProps> = ({
  children,
  wrapFocusable = true,
  roomId: externalRoomId,
}) => {
  const currentRoomId = useCurrentRoomId()
  const sessionPersisted = useSessionPersisted()
  const setCurrentRoomId = useSetCurrentRoomId()
  const setCurrentTitle = useSetCurrentTitle()
  const setSessionPersisted = useSetSessionPersisted()

  const { createNewSession } = useChatHistory()
  const useAiContextStore = useMemo(createAIChatContextStore, [])

  // Initialize room ID on mount
  useMemo(() => {
    if (!currentRoomId && !externalRoomId) {
      const newRoomId = createNewSession(false)
      setCurrentRoomId(newRoomId)
    } else if (externalRoomId && externalRoomId !== currentRoomId) {
      setCurrentRoomId(externalRoomId)
    }
  }, [currentRoomId, externalRoomId, createNewSession, setCurrentRoomId])

  const handleTitleGenerated = useCallback(
    async (title: string) => {
      if (currentRoomId) {
        try {
          await AIPersistService.updateSessionTitle(currentRoomId, title)
          setCurrentTitle(title)
        } catch (error) {
          console.error("Failed to update session title:", error)
        }
      }
    },
    [currentRoomId, setCurrentTitle],
  )

  const handleFirstMessage = useCallback(async () => {
    if (!sessionPersisted && currentRoomId) {
      try {
        await AIPersistService.createSession(currentRoomId, "New Chat")
        setSessionPersisted(true)
      } catch (error) {
        console.error("Failed to persist session:", error)
      }
    }
  }, [sessionPersisted, currentRoomId, setSessionPersisted])

  // Handle AI response completion - this is where we generate title
  const handleChatFinish = useEventCallback(
    async (options: { message: UIMessage<BizUIMetadata, UIDataTypes, BizUITools> }) => {
      const { message } = options

      // Only trigger title generation for assistant messages (AI responses)
      if (message.role !== "assistant") return

      // Get current messages to check if this is the first AI response

      const allMessages = chatInstance.messages

      // Check if we have exactly 2 messages (1 user + 1 assistant = first exchange)
      // Or if we have 2+ messages and this is the first assistant message
      const assistantMessages = allMessages.filter((m) => m.role === "assistant")
      const isFirstAIResponse = assistantMessages.length === 1

      if (isFirstAIResponse && allMessages.length >= 2) {
        try {
          // Generate title using the first user message and first AI response
          const firstExchange = allMessages.slice(0, 2)

          const title = await generateChatTitle(firstExchange)

          if (title) {
            await handleTitleGenerated(title)
          }
        } catch (error) {
          console.error("Failed to generate chat title:", error)
        }
      }
    },
  )
  const chatInstance = useMemo(() => {
    return new Chat<UIMessage<BizUIMetadata, UIDataTypes, BizUITools>>({
      // FIXME: this id can't modify after init, so used a fixed id
      id: "ai-room",
      transport: new DefaultChatTransport({
        api: `${env.VITE_API_URL}/ai/chat`,
        credentials: "include",
        fetch: (url: string | Request | URL, options?: RequestInit) => {
          if (!options?.body) return fetch(url, options)
          try {
            const state = useAiContextStore.getState()
            state.syncBlocksToContext()

            options.body = JSON.stringify({
              ...JSON.parse(options.body as string),
              context: state.state,
              blocks: state.blocks,
            })
          } catch (error) {
            console.error(error)
          }

          return fetch(url, options)
        },
      }),
      onError: (error) => {
        console.error(error)
      },
      onFinish: handleChatFinish,
    })
  }, [useAiContextStore, handleChatFinish])

  const ctx = useChat<UIMessage<BizUIMetadata, UIDataTypes, BizUITools>>({
    chat: chatInstance,
  })

  const handleNewChat = useCallback(() => {
    // Create a new session without persistence initially
    const newRoomId = createNewSession(false)
    setCurrentRoomId(newRoomId)
    setSessionPersisted(false)
    setCurrentTitle(undefined)
    // Clear messages
    ctx.setMessages([])
  }, [createNewSession, ctx, setCurrentRoomId, setSessionPersisted, setCurrentTitle])

  const handleSwitchRoom = useCallback(
    async (roomId: string) => {
      try {
        // First check if we need to save current messages
        if (sessionPersisted && currentRoomId && ctx.messages.length > 0) {
          // Messages are automatically saved by useSaveMessages hook
        }

        // Clear current messages before switching
        ctx.setMessages([])

        // Switch to new room
        setCurrentRoomId(roomId)

        // Load session info
        const sessionData = await AIPersistService.getChatSessions()
        const session = sessionData.find((s) => s.roomId === roomId)

        if (session) {
          setCurrentTitle(session.title || "New Chat")
          setSessionPersisted(true)
        } else {
          setCurrentTitle(undefined)
          setSessionPersisted(false)
        }

        // Messages will be loaded automatically by useLoadMessages in ChatInterface
      } catch (error) {
        console.error("Failed to switch room:", error)
        toast.error("Failed to switch chat session")
      }
    },
    [sessionPersisted, currentRoomId, ctx, setCurrentRoomId, setCurrentTitle, setSessionPersisted],
  )

  const panelRef = useRef<HTMLDivElement>(null!)
  const inputRef = useRef<HTMLTextAreaElement>(null!)
  const refsContext = useMemo<AIPanelRefs>(() => ({ panelRef, inputRef }), [panelRef, inputRef])

  // Provide session methods through context
  const sessionMethods = useMemo<AIChatSessionMethods>(
    () => ({
      handleTitleGenerated,
      handleFirstMessage,
      handleNewChat,
      handleSwitchRoom,
    }),
    [handleTitleGenerated, handleFirstMessage, handleNewChat, handleSwitchRoom],
  )

  if (!currentRoomId || !ctx) {
    return (
      <div className="bg-background flex size-full items-center justify-center">
        <div className="flex items-center gap-2">
          <i className="i-mgc-loading-3-cute-re text-text size-6 animate-spin" />
          <span className="text-text-secondary">Initializing chat...</span>
        </div>
      </div>
    )
  }

  const Element = (
    <AIChatContext value={ctx}>
      <AIPanelRefsContext value={refsContext}>
        <AIChatContextStoreContext value={useAiContextStore}>
          <AIChatSessionMethodsContext value={sessionMethods}>
            {children}
          </AIChatSessionMethodsContext>
        </AIChatContextStoreContext>
      </AIPanelRefsContext>
    </AIChatContext>
  )

  if (wrapFocusable) {
    return (
      <Focusable scope={HotkeyScope.AIChat} className="size-full">
        {Element}
      </Focusable>
    )
  }
  return Element
}
