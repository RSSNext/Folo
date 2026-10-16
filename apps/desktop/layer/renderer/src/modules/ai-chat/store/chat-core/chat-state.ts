import type { ChatState, ChatStatus } from "ai"
import { throttle } from "es-toolkit/compat"
import { produce } from "immer"
import { startTransition } from "react"

import { AIPersistService } from "../../services"
import { ChatStateEventEmitter } from "../event-system/event-emitter"
import type { BizUIMessage, SendingUIMessage } from "../types"
import type { ChatSlice } from "./types"

// Zustand Chat State that implements AI SDK ChatState interface
export class ZustandChatState implements ChatState<BizUIMessage> {
  #messages: BizUIMessage[]
  #status: ChatStatus
  #error: Error | undefined
  #eventEmitter: ChatStateEventEmitter
  #isResumingStream = false

  constructor(
    initialMessages: BizUIMessage[] = [],
    private updateZustandState: (updater: (state: ChatSlice) => ChatSlice) => void,
    private chatId: string,
  ) {
    this.#eventEmitter = new ChatStateEventEmitter()
    this.#messages = initialMessages
    this.#status = "ready"
    this.#error = undefined
    this.#setupEventHandlers()
  }

  #setupEventHandlers(): void {
    // Setup event handlers for automatic Zustand synchronization
    this.#eventEmitter.on("messages", ({ messages }) => {
      this.updateZustandState(
        produce((state) => {
          const stateMessages = state.messages
          for (let i = 0; i < messages.length; i++) {
            const message = messages[i]!
            if (!stateMessages[i]) {
              stateMessages[i] = structuredClone(message) as any
            } else {
              const stateMessage = stateMessages[i]!
              stateMessage.id = message.id

              for (let j = 0; j < message.parts.length; j++) {
                const statePart = stateMessage.parts[j] || {}
                const messagePart = message.parts[j]!

                Object.assign(statePart, messagePart)
                stateMessage.parts[j] = statePart as any
              }

              stateMessage.parts.length = message.parts.length

              stateMessage.role = message.role

              stateMessage.metadata = stateMessage.metadata ?? {}
              Object.assign(stateMessage.metadata, message.metadata)
            }
          }
          stateMessages.length = messages.length
        }),
      )
    })

    this.#eventEmitter.on("status", ({ status }) => {
      // Suppress the transient "submitted" status emitted when resumeStream probes for an active stream.
      if (this.#isResumingStream && status === "submitted") {
        return
      }

      this.updateZustandState((state) => {
        const isStreaming = status === "streaming"
        if (isStreaming) {
          void state.chatActions.markSessionSynced()
        }
        if (status === "ready" || status === "error") {
          void state.chatActions.adoptStoredTitle(this.chatId)
        }

        if (
          this.#isResumingStream &&
          (status === "ready" || status === "streaming" || status === "error")
        ) {
          this.#isResumingStream = false
        }

        return {
          ...state,
          status,
          isStreaming,
        }
      })
    })

    this.#eventEmitter.on("error", ({ error }) => {
      this.updateZustandState((state) => ({
        ...state,
        error,
      }))
    })
  }

  //// AI SDK ChatState abstract override methods or properties
  get status(): ChatStatus {
    return this.#status
  }

  set status(newStatus: ChatStatus) {
    if (this.#status === newStatus) return

    const wasStreaming = this.#status === "streaming"
    this.#status = newStatus
    this.#eventEmitter.emit("status", { status: newStatus })

    // Messages are not persisted while an answer streams, so save the result once it ends
    if (wasStreaming) {
      this.#persistMessages()
    }
  }

  get error(): Error | undefined {
    return this.#error
  }

  set error(newError: Error | undefined) {
    if (this.#error === newError) return

    this.#error = newError
    this.#eventEmitter.emit("error", { error: newError })
  }

  get messages(): BizUIMessage[] {
    return this.#messages
  }

  set messages(newMessages: BizUIMessage[]) {
    startTransition(() => {
      this.#messages = [...newMessages]

      this.#eventEmitter.emit("messages", { messages: this.#messages })

      // Auto-persist messages when they change. While an answer streams, every chunk replaces the
      // last message, and the streaming parts are skipped anyway, so rewriting the whole chat
      // each time only holds the database; the status setter saves once the stream ends.
      if (this.#status !== "streaming") {
        this.#persistMessages()
      }
    })
  }

  pushMessage = (message: SendingUIMessage) => {
    this.messages = this.#messages.concat(this.#fillMessageCreatedAt(message))
  }

  popMessage = () => {
    if (this.#messages.length === 0) return

    this.messages = this.#messages.slice(0, -1)
  }

  replaceMessage = (index: number, message: BizUIMessage) => {
    if (index < 0 || index >= this.#messages.length) return

    this.messages = [
      ...this.#messages.slice(0, index),
      this.snapshot(this.#fillMessageCreatedAt(message)),
      ...this.#messages.slice(index + 1),
    ]
  }

  snapshot = <T>(value: T): T => structuredClone(value)
  //// AI SDK ChatState abstract override methods or properties
  //// END

  #persistMessages = throttle(
    async () => {
      // Skip if no messages
      if (this.#messages.length === 0) return

      try {
        await AIPersistService.ensureSession(this.chatId)
        // Save messages using incremental updates
        await AIPersistService.replaceAllMessages(this.chatId, this.#messages)
      } catch (error) {
        console.error("Failed to persist messages:", error)
      }
    },
    100,
    { leading: false, trailing: true },
  )

  #fillMessageCreatedAt(message: SendingUIMessage | BizUIMessage): BizUIMessage {
    // we should directly edit the message object instead of creating a new one
    const nextMessage = message as BizUIMessage

    if (nextMessage.createdAt) return nextMessage
    if (
      nextMessage.role === "assistant" &&
      nextMessage.metadata?.finishTime &&
      nextMessage.metadata?.duration
    ) {
      nextMessage.createdAt = new Date(
        new Date(nextMessage.metadata.finishTime).getTime() - nextMessage.metadata.duration,
      )
    } else {
      nextMessage.createdAt = new Date()
    }

    return nextMessage
  }

  destroy(): void {
    this.#eventEmitter.clear()
  }

  setResumingStream(isResuming: boolean) {
    this.#isResumingStream = isResuming
  }
}
