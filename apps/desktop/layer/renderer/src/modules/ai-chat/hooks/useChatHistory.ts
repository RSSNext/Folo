import { useMemo } from "react"
import { useEventCallback } from "usehooks-ts"

import { aiChatSessionStoreActions, useAIChatSessionStore } from "~/modules/ai-chat-session/store"

export const useChatHistory = () => {
  const state = useAIChatSessionStore()

  const { sessions } = state
  const loading = state.isLoading || state.isSyncing

  const loadHistory = useEventCallback(async () => {
    if (loading) return

    aiChatSessionStoreActions.setLoading(true)
    aiChatSessionStoreActions.clearError()

    try {
      await aiChatSessionStoreActions.fetchRemoteSessions()
    } catch (error) {
      console.error("Failed to load chat history:", error)
      aiChatSessionStoreActions.setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      aiChatSessionStoreActions.setSyncing(false)
      aiChatSessionStoreActions.setLoading(false)
    }
  })

  return useMemo(
    () => ({
      sessions,
      loading,
      loadHistory,
      stats: state.stats,
      lastSyncedAt: state.lastSyncedAt,
      error: state.error,
    }),
    [sessions, loading, loadHistory, state.stats, state.lastSyncedAt, state.error],
  )
}
