import type { AIChatSession } from "@follow-app/client-sdk"

import type { ChatSession } from "~/modules/ai-chat/types/ChatSession"

export const isTaskSession = (session: ChatSession | AIChatSession): boolean => {
  if (!("lastSeenAt" in session) || !("updatedAt" in session)) return false
  if (!("chatId" in session) || !session.chatId.startsWith("ai-task")) return false
  return true
}

export const isUnreadSession = (session: ChatSession | AIChatSession): boolean => {
  if (!("lastSeenAt" in session) || !("updatedAt" in session)) return false
  return new Date(session.updatedAt) > new Date(session.lastSeenAt)
}
