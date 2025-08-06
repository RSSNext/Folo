import type { ChatStatus } from "ai"

import type { BizUIMessage } from "../types"
import type { ChatSliceActions } from "./chat-actions"

// Zustand slice interface
export interface ChatSlice {
  // Chat state (mirrored from ChatState)
  chatId: string
  messages: BizUIMessage[]
  status: ChatStatus
  error: Error | undefined
  isStreaming: boolean

  // UI state
  currentTitle: string | undefined

  // AI SDK Chat instance (forward declaration to avoid circular import)
  chatInstance: any

  // Actions
  chatActions: ChatSliceActions
}
