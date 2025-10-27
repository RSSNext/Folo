import type { AIChatMessage, AIChatSession, ListSessionsQuery } from "@follow-app/client-sdk"

import { getI18n } from "~/i18n"

import { followApi } from "../../lib/api-client"
import { queryClient } from "../../lib/query-client"
import { AIPersistService } from "../ai-chat/services"
import type { BizUIMessage, BizUIMetadata } from "../ai-chat/store/types"
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
   * Returns a small summary for observability.
   */
  async syncSessionsAndMessagesFromServer(filters?: ListSessionsQuery): Promise<{
    sessions: number
    messages: number
    failures: number
  }> {
    if (this.sync) {
      return { sessions: 0, messages: 0, failures: 0 }
    }

    this.sync = true

    aiChatSessionStoreActions.setSyncing(true)
    aiChatSessionStoreActions.clearError()

    await this.loadSessionsFromDb().catch((error) => {
      console.error("syncSessionsAndMessagesFromServer: failed to load local sessions", error)
    })

    let summary: { sessions: number; messages: number; failures: number } = {
      sessions: 0,
      messages: 0,
      failures: 0,
    }

    try {
      const res = await followApi.aiChatSessions.list(filters)
      const sessions = res.data

      let totalMessages = 0
      let failures = 0

      await Promise.allSettled(
        sessions.map((session) =>
          this.processSessionSync(session)
            .then((count) => {
              totalMessages += count
            })
            .catch((err) => {
              console.error(
                "syncSessionsAndMessagesFromServer: failed for session",
                session.chatId,
                err,
              )
              failures += 1
            }),
        ),
      )

      summary = { sessions: sessions.length, messages: totalMessages, failures }

      await this.loadSessionsFromDb()
      aiChatSessionStoreActions.setStats(summary)
      aiChatSessionStoreActions.setLastSyncedAt(new Date())
      return summary
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

  private async processSessionSync(session: AIChatSession): Promise<number> {
    const dbSession = await AIPersistService.getChatSession(session.chatId)
    const lastUpdatedAt = dbSession ? dbSession.updatedAt : new Date(0)
    if (lastUpdatedAt >= new Date(session.updatedAt)) {
      return 0
    }

    await AIPersistService.ensureSession(session.chatId, {
      title: session.title,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    })

    const unseenMessages = await this.fetchUnseenRemoteMessages(session.chatId, lastUpdatedAt)
    if (unseenMessages.length === 0) {
      return 0
    }

    const normalized = unseenMessages.map(this.normalizeRemoteMessage)
    await AIPersistService.upsertMessages(session.chatId, normalized)

    return normalized.length
  }

  async loadSessionsFromDb() {
    const { t } = getI18n()
    const rows = await AIPersistService.getChatSessions()
    const normalized = rows.map((row) => ({
      chatId: row.chatId,
      title: row.title || t("ai:common.new_chat"),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      messageCount: row.messageCount,
    }))
    aiChatSessionStoreActions.setSessions(normalized)
    return normalized
  }
  /**
   * Fetch messages for a chat session from the remote API and persist (upsert) them locally.
   * Returns the normalized BizUIMessage list that was persisted.
   *
   * Defensive in extracting the message array because the SDK response shape may evolve.
   */
  async fetchAndPersistMessages(session: AIChatSession): Promise<void> {
    const dbSession = await AIPersistService.getChatSession(session.chatId)
    const lastUpdatedAt = dbSession ? dbSession.updatedAt : new Date(0)
    if (lastUpdatedAt >= new Date(session.updatedAt)) {
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
      updatedAt: new Date(session.updatedAt),
    })
    await AIPersistService.upsertMessages(session.chatId, normalized)

    await followApi.aiChatSessions.markSeen({
      chatId: session.chatId,
      lastSeenAt: new Date().toISOString(),
    })

    await this.loadSessionsFromDb()
    aiChatSessionStoreActions.setLastSyncedAt(new Date())

    // Invalidate related queries so UI updates outside of hook-based mutation flows
    Promise.all([
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.detail(session.chatId) }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.lists }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.unread }),
    ])
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
      // Remove this comment once @follow-app/client-sdk updated
      // @ts-expect-error TODO fix message part types
      parts: msg.messageParts,
      metadata,
      createdAt: new Date(msg.createdAt),
    }
  }
}

export const AIChatSessionService = new AIChatSessionServiceStatic()
