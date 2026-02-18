import type { AIChatSession } from "@follow-app/client-sdk"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { useTimelineSummaryAutoContext } from "~/modules/ai-chat/hooks/useTimelineSummaryAutoContext"
import { AIPersistService } from "~/modules/ai-chat/services"
import { useChatActions, useCurrentChatId } from "~/modules/ai-chat/store/hooks"
import type { ChatSession } from "~/modules/ai-chat/types/ChatSession"
import { AIChatSessionService } from "~/modules/ai-chat-session"
import {
  useDeleteAIChatSessionMutation,
  useMarkChatSessionSeenMutation,
} from "~/modules/ai-chat-session/query"

import { isUnreadSession } from "./utils"

export interface UseChatSessionHandlersProps {
  sessions?: (ChatSession | AIChatSession)[]
}

export const useChatSessionHandlers = ({ sessions = [] }: UseChatSessionHandlersProps) => {
  const { t } = useTranslation("ai")
  const chatActions = useChatActions()
  const currentChatId = useCurrentChatId()
  const shouldDisableTimelineSummary = useTimelineSummaryAutoContext()
  const { ask } = useDialog()
  const deleteSessionMutation = useDeleteAIChatSessionMutation()
  const markChatSessionSeenMutation = useMarkChatSessionSeenMutation()

  const handleSessionSelect = useCallback(
    async (session: ChatSession | AIChatSession) => {
      if (session.chatId === currentChatId) {
        console.warn("Session already active, no action taken")
        return
      }

      // Only sync AI chat sessions (not local ChatSession)
      if ("userId" in session) {
        try {
          await AIChatSessionService.fetchAndPersistMessages(session as AIChatSession)
        } catch (e) {
          console.error("Failed to sync chat session messages:", e)
          toast.error("Failed to load chat messages")
        }
      }

      if (shouldDisableTimelineSummary) {
        chatActions.setTimelineSummaryManualOverride(true)
      }
      chatActions.switchToChat(session.chatId)

      // Mark as seen only for AI chat sessions
      if ("userId" in session && isUnreadSession(session)) {
        markChatSessionSeenMutation.mutate({
          chatId: session.chatId,
          lastSeenAt: new Date().toISOString(),
        })
      }
    },
    [chatActions, currentChatId, markChatSessionSeenMutation, shouldDisableTimelineSummary],
  )

  const handleDeleteSession = useCallback(
    async (
      chatId: string,
      options: {
        event?: React.MouseEvent
        onBeforeDelete?: () => void
      } = {},
    ) => {
      options.event?.stopPropagation()
      options.event?.preventDefault()

      const session = sessions?.find((s) => s.chatId === chatId)
      if (!session) return

      const confirm = await ask({
        title: t("delete_chat"),
        message: t("delete_chat_message", { title: session.title || "Untitled Chat" }),
        variant: "danger",
      })

      if (!confirm) return
      options.onBeforeDelete?.()

      try {
        // Only delete AI chat sessions through the mutation
        if ("userId" in session) {
          await deleteSessionMutation.mutateAsync({ chatId })
        }

        // Always delete from local persistence
        await AIPersistService.deleteSession(chatId)

        toast.success(t("delete_chat_success"))

        if (chatId === currentChatId) {
          if (shouldDisableTimelineSummary) {
            chatActions.setTimelineSummaryManualOverride(true)
          }
          chatActions.newChat()
        }
      } catch (error) {
        console.error("Failed to delete session:", error)
        toast.error(t("delete_chat_error"))
      }
    },
    [
      sessions,
      ask,
      t,
      currentChatId,
      chatActions,
      deleteSessionMutation,
      shouldDisableTimelineSummary,
    ],
  )

  return {
    handleSessionSelect,
    handleDeleteSession,
  }
}
