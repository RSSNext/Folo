import type { ChatStatus } from "ai"

import type { BizUIMessage } from "../types"

// Event types and payloads
export interface ChatStateEvents<UI_MESSAGE extends BizUIMessage> {
  messages: { messages: UI_MESSAGE[] }
  status: { status: ChatStatus }
  error: { error: Error | undefined }
}

export type ChatStateEventType = keyof ChatStateEvents<any>
