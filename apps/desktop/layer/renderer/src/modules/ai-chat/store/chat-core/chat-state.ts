import type { ChatState, ChatStatus } from "ai"
import { throttle } from "es-toolkit/compat"

import { AIPersistService } from "../../services"
import { ChatStateEventEmitter } from "../event-system/event-emitter"
import type { BizUIMessage } from "../types"
import type { ChatSlice } from "./types"

// Zustand Chat State that implements AI SDK ChatState interface
export class ZustandChatState<UI_MESSAGE extends BizUIMessage> implements ChatState<UI_MESSAGE> {
  #messages: UI_MESSAGE[]
  #status: ChatStatus = "ready"
  #error: Error | undefined = undefined
  #eventEmitter = new ChatStateEventEmitter<UI_MESSAGE>()

  constructor(
    initialMessages: UI_MESSAGE[] = [],
    private updateZustandState: (updater: (state: ChatSlice) => ChatSlice) => void,
    private chatId: string,
  ) {
    this.#messages = initialMessages
    this.#setupEventHandlers()
  }

  #setupEventHandlers(): void {
    // Setup event handlers for automatic Zustand synchronization
    this.#eventEmitter.on("messages", ({ messages }) => {
      this.updateZustandState((state) => ({
        ...state,
        messages: [...messages],
      }))
    })

    this.#eventEmitter.on("status", ({ status }) => {
      this.updateZustandState((state) => ({
        ...state,
        status,
        isStreaming: status === "streaming",
      }))
    })

    this.#eventEmitter.on("error", ({ error }) => {
      this.updateZustandState((state) => ({
        ...state,
        error,
      }))
    })
  }

  get status(): ChatStatus {
    return this.#status
  }

  set status(newStatus: ChatStatus) {
    if (this.#status === newStatus) return

    this.#status = newStatus
    this.#eventEmitter.emit("status", { status: newStatus })
  }

  get error(): Error | undefined {
    return this.#error
  }

  set error(newError: Error | undefined) {
    if (this.#error === newError) return

    this.#error = newError
    this.#eventEmitter.emit("error", { error: newError })
  }

  get messages(): UI_MESSAGE[] {
    return this.#messages
  }

  set messages(newMessages: UI_MESSAGE[]) {
    this.#messages = [...newMessages]
    this.#eventEmitter.emit("messages", { messages: this.#messages })

    // Auto-persist messages when they change
    this.#persistMessages()
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.messages = this.#messages.concat(message)
  }

  popMessage = () => {
    if (this.#messages.length === 0) return

    this.messages = this.#messages.slice(0, -1)
  }

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    if (index < 0 || index >= this.#messages.length) return

    this.messages = [
      ...this.#messages.slice(0, index),
      // Deep clone the message to ensure React detects changes
      this.snapshot(message),
      ...this.#messages.slice(index + 1),
    ]
  }

  snapshot = <T>(value: T): T => structuredClone(value)

  // Callback registration methods with proper AI SDK compatibility
  registerMessagesCallback = (onChange: () => void, throttleWaitMs?: number): (() => void) => {
    const callback = throttleWaitMs ? throttle(onChange, throttleWaitMs) : onChange

    // Convert payload-based event to AI SDK expected callback format
    return this.#eventEmitter.on("messages", () => callback())
  }

  registerStatusCallback = (onChange: () => void): (() => void) => {
    // Convert payload-based event to AI SDK expected callback format
    return this.#eventEmitter.on("status", () => onChange())
  }

  registerErrorCallback = (onChange: () => void): (() => void) => {
    // Convert payload-based event to AI SDK expected callback format
    return this.#eventEmitter.on("error", () => onChange())
  }

  // Internal event subscription with payload access
  onMessagesChange = (listener: (messages: UI_MESSAGE[]) => void): (() => void) => {
    return this.#eventEmitter.on("messages", ({ messages }) => listener(messages))
  }

  onStatusChange = (listener: (status: ChatStatus) => void): (() => void) => {
    return this.#eventEmitter.on("status", ({ status }) => listener(status))
  }

  onErrorChange = (listener: (error: Error | undefined) => void): (() => void) => {
    return this.#eventEmitter.on("error", ({ error }) => listener(error))
  }

  // Persistence methods
  #persistMessages = throttle(
    async () => {
      // Skip if no messages
      if (this.#messages.length === 0) return

      try {
        await AIPersistService.ensureSession(this.chatId, "New Chat")
        // Save messages using incremental updates
        await AIPersistService.upsertMessages(this.chatId, this.#messages)
      } catch (error) {
        console.error("Failed to persist messages:", error)
      }
    },
    100,
    { leading: true, trailing: true },
  )

  // Cleanup method
  destroy(): void {
    this.#eventEmitter.clear()
  }
}
