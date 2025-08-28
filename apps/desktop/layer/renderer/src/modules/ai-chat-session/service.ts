import type { AIChatMessage, AIChatSession } from "@follow-app/client-sdk"

import { followApi } from "../../lib/api-client"
import { queryClient } from "../../lib/query-client"
import { AIPersistService } from "../ai-chat/services"
import type { BizUIMessage } from "../ai-chat/store/types"
import { aiChatSessionKeys } from "./query"

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
    const response = await followApi.aiChatSessions.messages.get({
      chatId: session.chatId,
    })
    const { data } = response
    // TODO fetch more pages base data.nextBefore and session.lastSeenAt

    const chatMessages = data.messages
    const normalized = chatMessages.map(this.normalizeRemoteMessage)

    await AIPersistService.ensureSession(session.chatId, session.title)
    await AIPersistService.upsertMessages(session.chatId, normalized)

    await followApi.aiChatSessions.markSeen({
      chatId: session.chatId,
      lastSeenAt: new Date().toISOString(),
    })

    // Invalidate related queries so UI updates outside of hook-based mutation flows
    Promise.all([
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.detail(session.chatId) }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: aiChatSessionKeys.unread() }),
    ])
    return normalized
  }

  /**
   * Normalize a remote message object into BizUIMessage shape expected by the local chat system.
   */
  private normalizeRemoteMessage = (msg: AIChatMessage): BizUIMessage => {
    const startTime = msg.createdAt
    const finishTime = msg.finishedAt ?? undefined
    const duration = finishTime
      ? new Date(finishTime).getTime() - new Date(startTime).getTime()
      : undefined

    const metadata: BizUIMessage["metadata"] = {
      startTime,
      finishTime,
      duration,
    }

    const normalizedParts = msg.messageParts.filter(
      (i) => i.type === "text",
    ) satisfies BizUIMessage["parts"]

    return {
      id: msg.id,
      role: msg.role satisfies BizUIMessage["role"],
      parts: normalizedParts,
      metadata,
    }
  }
}

export const AIChatSessionService = new AIChatSessionServiceStatic()
