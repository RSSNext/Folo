import { createWithEqualityFn } from "zustand/traditional"

import { getI18n } from "~/i18n"

import type { ChatSession } from "../ai-chat/types/ChatSession"
import { AIChatSessionService } from "./service"

export interface AIChatSessionSyncStats {
  sessions: number
  messages: number
  failures: number
}

export interface AIChatSessionViewModelState {
  sessions: ChatSession[]
  isLoading: boolean
  isSyncing: boolean
  stats: AIChatSessionSyncStats
  lastSyncedAt?: Date
  error?: string
}

const createInitialStats = (): AIChatSessionSyncStats => ({
  sessions: 0,
  messages: 0,
  failures: 0,
})

export const useAIChatSessionStore = createWithEqualityFn<AIChatSessionViewModelState>(() => ({
  sessions: [],
  isLoading: false,
  isSyncing: false,
  stats: createInitialStats(),
  lastSyncedAt: undefined,
  error: undefined,
}))

const { setState, getState, subscribe } = useAIChatSessionStore

export const aiChatSessionStoreActions = {
  setSessions: (sessions: ChatSession[]) =>
    setState({
      sessions,
    }),
  setLoading: (isLoading: boolean) =>
    setState({
      isLoading,
    }),
  setSyncing: (isSyncing: boolean) =>
    setState({
      isSyncing,
    }),
  setStats: (stats: AIChatSessionSyncStats) =>
    setState({
      stats: { ...stats },
    }),
  resetStats: () =>
    setState({
      stats: createInitialStats(),
    }),
  setLastSyncedAt: (lastSyncedAt?: Date) =>
    setState({
      lastSyncedAt,
    }),
  setError: (error?: string) =>
    setState({
      error,
    }),
  clearError: () =>
    setState({
      error: undefined,
    }),

  // syncing
  fetchRemoteSessions: async () => {
    try {
      const { t } = getI18n()
      const sessions = await AIChatSessionService.syncSessionsAndMessagesFromServer()
      aiChatSessionStoreActions.setSessions(
        sessions.map((session) => ({
          chatId: session.chatId,
          title: session.title || t("ai:common.new_chat"),
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          isLocal: false,
          syncStatus: "synced" as const,
        })),
      )
    } catch (error) {
      console.error("fetchRemoteSessionsAndMessages: failed", error)
      aiChatSessionStoreActions.setError(error instanceof Error ? error.message : "fetch_failed")
    }
  },
}

export const useAIChatSessionViewModel = useAIChatSessionStore

export const createEmptyAIChatSessionSyncStats = createInitialStats

export const getAIChatSessionState = getState
export const subscribeAIChatSessionStore = subscribe

export const hydrateSessionsFromLocalDb = async () => {
  try {
    await AIChatSessionService.loadSessionsFromDb()
  } catch (error) {
    console.error("hydrateSessionsFromLocalDb: failed", error)
    aiChatSessionStoreActions.setError(error instanceof Error ? error.message : "hydrate_failed")
  }
}

void hydrateSessionsFromLocalDb()
