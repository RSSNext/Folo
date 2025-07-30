import type { FC, PropsWithChildren } from "react"
import { useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import type { AIChatSessionMethods, AIPanelRefs } from "../__internal__/AIChatContext"
import {
  AIChatSessionMethodsContext,
  AIChatStoreContext,
  AIPanelRefsContext,
} from "../__internal__/AIChatContext"
import { useChatActions, useChatInstance, useCurrentRoomId } from "../__internal__/hooks"
import { createAIChatStore } from "../__internal__/store"
import { useSessionPersisted, useSetSessionPersisted } from "../atoms/session"
import { useChatHistory } from "../hooks/useChatHistory"
import { AIPersistService } from "../services"

interface AIChatRootProps extends PropsWithChildren {
  wrapFocusable?: boolean
  roomId?: string
}

// Inner component that has access to the AI chat store context
const AIChatRootInner: FC<AIChatRootProps> = ({ children, roomId: externalRoomId }) => {
  const sessionPersisted = useSessionPersisted()
  const setSessionPersisted = useSetSessionPersisted()

  const { createNewSession } = useChatHistory()

  // Use the new internal hooks
  const currentRoomId = useCurrentRoomId()

  const chatActions = useChatActions()
  const chatInstance = useChatInstance()

  // Initialize room ID on mount
  useMemo(() => {
    if (!currentRoomId && !externalRoomId) {
      createNewSession(false)
      chatActions.newChat()
    } else if (externalRoomId && externalRoomId !== currentRoomId) {
      chatActions.newChat()
    }
  }, [currentRoomId, externalRoomId, createNewSession, chatActions])

  const handleTitleGenerated = useCallback(
    async (title: string) => {
      if (currentRoomId) {
        try {
          await AIPersistService.updateSessionTitle(currentRoomId, title)
          chatActions.setCurrentTitle(title)
        } catch (error) {
          console.error("Failed to update session title:", error)
        }
      }
    },
    [currentRoomId, chatActions],
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

  const handleNewChat = useCallback(() => {
    chatActions.newChat()
    setSessionPersisted(false)
    chatActions.setCurrentTitle(undefined)
  }, [chatActions, setSessionPersisted])

  const handleSwitchRoom = useCallback(
    async (roomId: string) => {
      try {
        // First check if we need to save current messages
        if (sessionPersisted && currentRoomId && chatInstance.chatState.messages.length > 0) {
          // Messages are automatically saved by useSaveMessages hook
        }

        // Clear current messages and switch to new room
        chatActions.newChat()

        // Load session info
        const sessionData = await AIPersistService.getChatSessions()
        const session = sessionData.find((s) => s.roomId === roomId)

        if (session) {
          chatActions.setCurrentTitle(session.title || "New Chat")
          setSessionPersisted(true)
        } else {
          chatActions.setCurrentTitle(undefined)
          setSessionPersisted(false)
        }

        // Messages will be loaded automatically by useLoadMessages in ChatInterface
      } catch (error) {
        console.error("Failed to switch room:", error)
        toast.error("Failed to switch chat session")
      }
    },
    [sessionPersisted, currentRoomId, chatInstance, chatActions, setSessionPersisted],
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

  if (!currentRoomId) {
    return (
      <div className="bg-background flex size-full items-center justify-center">
        <div className="flex items-center gap-2">
          <i className="i-mgc-loading-3-cute-re text-text size-6 animate-spin" />
          <span className="text-text-secondary">Initializing chat...</span>
        </div>
      </div>
    )
  }

  return (
    <AIPanelRefsContext value={refsContext}>
      <AIChatSessionMethodsContext value={sessionMethods}>{children}</AIChatSessionMethodsContext>
    </AIPanelRefsContext>
  )
}

export const AIChatRoot: FC<AIChatRootProps> = ({
  children,
  wrapFocusable = true,
  roomId: externalRoomId,
}) => {
  const useAiContextStore = useMemo(createAIChatStore, [])

  const Element = (
    <AIChatStoreContext value={useAiContextStore}>
      <AIChatRootInner roomId={externalRoomId}>{children}</AIChatRootInner>
    </AIChatStoreContext>
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
