import { useCallback, useState } from "react"

import { getI18n } from "~/i18n"
import { AIPersistService } from "~/modules/ai-chat/services/index"
import { AIChatSessionService } from "~/modules/ai-chat-session/service"

import type { ChatSession } from "../types/ChatSession"

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoading(true)

    const { t } = getI18n()
    try {
      await AIChatSessionService.syncSessionsAndMessagesFromServer()
      const result = await AIPersistService.getChatSessions()
      const sessions: ChatSession[] = result.map((row) => ({
        chatId: row.chatId,
        title: row.title || t("ai:common.new_chat"),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        messageCount: row.messageCount,
      }))

      setSessions(sessions)
    } catch (error) {
      console.error("Failed to load chat history:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    sessions,
    loading,
    loadHistory,
  }
}
