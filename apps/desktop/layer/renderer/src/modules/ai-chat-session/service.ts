import type { AIChatMessage, AIChatSession } from "@follow-app/client-sdk"

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
  /**
   * Fetch messages for a chat session from the remote API and persist (upsert) them locally.
   * Returns the normalized BizUIMessage list that was persisted.
   *
   * Defensive in extracting the message array because the SDK response shape may evolve.
   */
  async fetchAndPersistMessages(session: AIChatSession): Promise<BizUIMessage[]> {
    const unseenMessages = await this.fetchUnseenRemoteMessages(session.chatId, session.lastSeenAt)
    const normalized = unseenMessages.map(this.normalizeRemoteMessage)

    await AIPersistService.ensureSession(session.chatId, session.title)
    await AIPersistService.upsertMessages(session.chatId, normalized)

    await followApi.aiChatSessions.markSeen({
      chatId: session.chatId,
      lastSeenAt: new Date().toISOString(),
    })

    // Invalidate related queries so UI updates outside of hook-based mutation flows
    Promise.all([
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.detail(session.chatId) }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.lists }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.unread }),
    ])
    return normalized
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
    lastSeenAt: string,
  ): Promise<AIChatMessage[]> {
    const allMessages: AIChatMessage[] = []
    const lastSeenAtDate = new Date(lastSeenAt)
    let before: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const resp = await followApi.aiChatSessions.messages.get(
        before ? { chatId, before } : { chatId },
      )
      const { data } = resp
      const batch = data.messages
      allMessages.push(...batch)

      const { nextBefore } = data
      if (!nextBefore || new Date(nextBefore) <= lastSeenAtDate) {
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

    const normalizedParts = msg.messageParts.filter(
      (i) => i.type === "text",
    ) satisfies BizUIMessage["parts"]

    return {
      id: msg.id,
      role: msg.role satisfies BizUIMessage["role"],
      parts: normalizedParts,
      metadata,
      createdAt: new Date(msg.createdAt),
    }
  }
}

export const AIChatSessionService = new AIChatSessionServiceStatic()
