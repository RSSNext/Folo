import type { AIChatMessage, AIChatSession, ListSessionsQuery } from "@follow-app/client-sdk"
import type { UIMessagePart } from "ai"

import { followApi } from "../../lib/api-client"
import { queryClient } from "../../lib/query-client"
import { AIPersistService } from "../ai-chat/services"
import type {
  BizUIDataTypes,
  BizUIMessage,
  BizUIMetadata,
  BizUITools,
} from "../ai-chat/store/types"
import { aiChatSessionKeys } from "./query"
import { aiChatSessionStoreActions } from "./store"

// Hard cap on pagination to prevent excessive API calls while keeping initial sync fast.
const MAX_PAGES = 10

/**
 * Service for syncing AI chat session messages from remote API into local DB.
 */
class AIChatSessionServiceStatic {
  private sync = false

  /**
   * List sessions from backend and ensure local DB has sessions and unseen messages.
   * This does NOT mark sessions as seen on the server (non-destructive sync).
   *
   * Returns the list of sessions.
   */
  async syncSessionsAndMessagesFromServer(filters?: ListSessionsQuery): Promise<AIChatSession[]> {
    if (this.sync) {
      return []
    }

    this.sync = true

    aiChatSessionStoreActions.setSyncing(true)
    aiChatSessionStoreActions.clearError()

    try {
      const { data: sessions } = await followApi.aiChatSessions.list(filters)

      const summary = { sessions: sessions.length, messages: 0, failures: 0 }

      sessions.forEach(async (session) => {
        await AIPersistService.ensureSession(session.chatId, {
          title: session.title,
          createdAt: new Date(session.createdAt),
          // Use createdAt for updatedAt as we are syncing session instead of messages
          updatedAt: new Date(session.createdAt),
          isLocal: false,
        })
      })
      await this.loadSessionsFromDb()
      aiChatSessionStoreActions.setStats(summary)
      aiChatSessionStoreActions.setLastSyncedAt(new Date())
      return sessions
    } catch (error) {
      aiChatSessionStoreActions.setError(
        error instanceof Error ? error.message : "Failed to sync chat sessions",
      )
      throw error
    } finally {
      aiChatSessionStoreActions.setSyncing(false)
      this.sync = false
    }
  }

  async loadSessionsFromDb() {
    const rows = await AIPersistService.getChatSessions()

    aiChatSessionStoreActions.setSessions(rows)
    return rows
  }
  /**
   * Fetch messages for a chat session from the remote API and persist (upsert) them locally.
   * Returns the normalized BizUIMessage list that was persisted.
   *
   * Defensive in extracting the message array because the SDK response shape may evolve.
   */
  async fetchAndPersistMessages(
    session: AIChatSession,
    options?: {
      force?: boolean
    },
  ): Promise<void> {
    const [dbSession, hasPersistedMessages] = await Promise.all([
      AIPersistService.getChatSession(session.chatId),
      AIPersistService.hasPersistedMessages(session.chatId),
    ])

    const lastUpdatedAt = dbSession ? dbSession.updatedAt : new Date(0)
    const hasUpToDateSession = lastUpdatedAt >= new Date(session.updatedAt)

    if (!options?.force && hasUpToDateSession && hasPersistedMessages) {
      // If local session is already up-to-date, skip fetching messages
      return
    }
    const unseenMessages = await this.fetchUnseenRemoteMessages(
      session.chatId,
      new Date(session.lastSeenAt),
    )
    const normalized = unseenMessages.map(this.normalizeRemoteMessage)

    await AIPersistService.ensureSession(session.chatId, {
      title: session.title,
      createdAt: new Date(session.createdAt),
      // Use createdAt for updatedAt
      // Because we are fetching session data instead of messages
      updatedAt: new Date(session.createdAt),
      isLocal: false,
    })
    await AIPersistService.upsertMessages(session.chatId, normalized)

    await this.loadSessionsFromDb()
    aiChatSessionStoreActions.setLastSyncedAt(new Date())

    // Invalidate related queries so UI updates outside of hook-based mutation flows
    Promise.all([
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.detail(session.chatId) }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.lists }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.unread }),
    ])
  }

  async syncSessionMessages(chatId: string) {
    try {
      const sessionRecord = await AIPersistService.getChatSession(chatId)
      if (sessionRecord?.isLocal) {
        return AIPersistService.loadUIMessages(chatId)
      }

      const sessionResponse = await followApi.aiChatSessions.get({ chatId })
      const session = sessionResponse.data

      if (!session) {
        return AIPersistService.loadUIMessages(chatId)
      }

      await this.fetchAndPersistMessages(session)
      return AIPersistService.loadUIMessages(chatId)
    } catch (error) {
      console.error("syncSessionMessages: failed", error)
      throw error
    }
  }

  /**
   * Fetch remote messages for a chat session that are newer than the provided lastSeenAt timestamp.
   * Implements keyset pagination using `before` / `nextBefore` and stops when:
   *  - We have paged past (<=) lastSeenAt, or
   *  - There is no further `nextBefore`, or
   *  - A safety MAX_PAGES cap is reached.
   * Returns only unseen (newer) remote messages.
   */
  private async fetchUnseenRemoteMessages(
    chatId: string,
    lastSeenAt: Date,
  ): Promise<AIChatMessage[]> {
    const allMessages: AIChatMessage[] = []
    let before: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const resp = await followApi.aiChatSessions.messages.get(
        before ? { chatId, before } : { chatId },
      )
      const { data } = resp
      const batch = data.messages
      allMessages.push(...batch)

      const { nextBefore } = data
      if (!nextBefore || new Date(nextBefore) <= lastSeenAt) {
        break
      }
      before = nextBefore
    }
    return allMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }

  /**
   * Normalize a remote message object into BizUIMessage shape expected by the local chat system.
   */
  private normalizeRemoteMessage = (msg: AIChatMessage): BizUIMessage => {
    const metadata =
      msg.metadata && typeof msg.metadata === "object" ? (msg.metadata as BizUIMetadata) : undefined
    return {
      id: msg.id,
      role: msg.role satisfies BizUIMessage["role"],
      parts: msg.messageParts as UIMessagePart<BizUIDataTypes, BizUITools>[],
      metadata,
      createdAt: new Date(msg.createdAt),
    }
  }
}

export const AIChatSessionService = new AIChatSessionServiceStatic()
