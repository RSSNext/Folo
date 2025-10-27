import type { AIChatMessage, AIChatSession, ListSessionsQuery } from "@follow-app/client-sdk"

import { followApi } from "../../lib/api-client"
import { queryClient } from "../../lib/query-client"
import { AIPersistService } from "../ai-chat/services"
import type { BizUIMessage, BizUIMetadata } from "../ai-chat/store/types"
import { aiChatSessionKeys } from "./query"

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
    const res = await followApi.aiChatSessions.list(filters)
    const sessions = res.data

    let totalMessages = 0
    let failures = 0

    for (const session of sessions) {
      const { messages, failure } = await this.syncSingleSession(session)
      totalMessages += messages
      if (failure) failures += 1
    }
    return { sessions: sessions.length, messages: totalMessages, failures }
  }

  /**
   * Inner operation for a single session in the sync loop.
   * Ensures local session exists and pulls unseen remote messages without
   * mutating remote read state. Returns processed message count and failure flag.
   */
  async syncSingleSession(session: AIChatSession): Promise<{
    messages: number
    failure: boolean
  }> {
    const dbSession = await AIPersistService.getChatSession(session.chatId)
    const lastUpdatedAt = dbSession ? dbSession.updatedAt : new Date(0)
    if (lastUpdatedAt >= new Date(session.updatedAt)) {
      // Local session already up-to-date, skip fetching messages
      return { messages: 0, failure: false }
    }
    try {
      // Ensure session exists locally first
      await AIPersistService.ensureSession(session.chatId, {
        title: session.title,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      })

      // Fetch unseen messages (newer than lastSeenAt) without changing read state remotely
      const unseenMessages = await this.fetchUnseenRemoteMessages(session.chatId, lastUpdatedAt)
      if (unseenMessages.length === 0) return { messages: 0, failure: false }

      const normalized = unseenMessages.map(this.normalizeRemoteMessage)
      await AIPersistService.upsertMessages(session.chatId, normalized)
      return { messages: normalized.length, failure: false }
    } catch (err) {
      // Keep going even if a single session fails
      console.error("syncSingleSession: failed for session", session.chatId, err)
      return { messages: 0, failure: true }
    }
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
      parts: msg.messageParts,
      metadata,
      createdAt: new Date(msg.createdAt),
    }
  }
}

export const AIChatSessionService = new AIChatSessionServiceStatic()
