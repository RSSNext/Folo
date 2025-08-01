import type { BizUIMessage } from "../types"
import type { ChatStateEvents, ChatStateEventType } from "./types"

// Event emitter for AI chat state changes with typed payloads
export class ChatStateEventEmitter<UI_MESSAGE extends BizUIMessage> {
  #listeners = new Map<ChatStateEventType, Set<(payload: any) => void>>()

  on<T extends ChatStateEventType>(
    event: T,
    listener: (payload: ChatStateEvents<UI_MESSAGE>[T]) => void,
  ): () => void {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set())
    }
    this.#listeners.get(event)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.#listeners.get(event)?.delete(listener)
    }
  }

  emit<T extends ChatStateEventType>(event: T, payload: ChatStateEvents<UI_MESSAGE>[T]): void {
    this.#listeners.get(event)?.forEach((listener) => {
      try {
        listener(payload)
      } catch (error) {
        console.error(`Error in chat state listener for event ${event}:`, error)
      }
    })
  }

  clear(): void {
    this.#listeners.clear()
  }
}
