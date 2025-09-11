import type { ChatInit, ChatStatus } from "ai"
import { AbstractChat } from "ai"

import type { BizUIMessage } from "../types"
import { ZustandChatState } from "./chat-state"
import type { ChatSlice } from "./types"

// Custom Chat class that uses Zustand-integrated state
export class ZustandChat extends AbstractChat<BizUIMessage> {
  override state: ZustandChatState
  #unsubscribeFns: (() => void)[] = []

  constructor(
    { messages, ...init }: ChatInit<BizUIMessage>,
    updateZustandState: (updater: (state: ChatSlice) => ChatSlice) => void,
  ) {
    const state = new ZustandChatState(messages, updateZustandState, init.id || "")
    super({ ...init, state })
    this.state = state
  }

  // Public getter for state access
  get chatState() {
    return this.state
  }

  // Cleanup method
  destroy(): void {
    // Unsubscribe from AI SDK callbacks
    this.#unsubscribeFns.forEach((unsubscribe) => unsubscribe())
    this.#unsubscribeFns = []

    this.state.destroy()
  }

  protected override setStatus({ status, error }: { status: ChatStatus; error?: Error }): void {
    super.setStatus({ status, error })
    this.state.status = status
    this.state.error = error
  }
}
