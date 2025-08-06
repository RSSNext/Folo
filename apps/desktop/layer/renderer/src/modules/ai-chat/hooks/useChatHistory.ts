import { useCallback, useState } from "react"

import { AIPersistService } from "~/modules/ai-chat/services/index"

import type { ChatSession } from "../types/ChatSession"

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const result = await AIPersistService.getChatSessions()
      const sessions: ChatSession[] = result.map((row) => ({
        chatId: row.chatId,
        title: row.title || "New Chat",
        createdAt: new Date(row.createdAt),
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
