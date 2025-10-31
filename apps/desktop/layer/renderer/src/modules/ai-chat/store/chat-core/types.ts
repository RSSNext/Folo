import type { ChatStatus } from "ai"

import type { BizUIMessage } from "../types"
import type { ChatSliceActions } from "./chat-actions"
import type { ZustandChat } from "./chat-instance"

// Zustand slice interface
export interface ChatSlice {
  chatId: string
  messages: BizUIMessage[]
  status: ChatStatus
  error: Error | undefined
  isStreaming: boolean
  isLocal: boolean
  syncStatus: "local" | "synced"

  // UI state
  currentTitle: string | undefined

  // AI SDK Chat instance (forward declaration to avoid circular import)
  chatInstance: ZustandChat

  // Actions
  chatActions: ChatSliceActions

  // Scene
  scene: "general" | "onboarding" | "timeline-summary"

  timelineSummaryManualOverride: boolean
}
