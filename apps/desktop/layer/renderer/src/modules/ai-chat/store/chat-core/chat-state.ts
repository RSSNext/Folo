/* eslint-disable unicorn/no-for-loop */
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
  #status: ChatStatus = "ready"
  #error: Error | undefined = undefined
  #eventEmitter = new ChatStateEventEmitter()

  constructor(
    initialMessages: BizUIMessage[] = [],
    private updateZustandState: (updater: (state: ChatSlice) => ChatSlice) => void,
    private chatId: string,
  ) {
    this.#messages = initialMessages
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
      this.updateZustandState((state) => {
        const isStreaming = status === "streaming"
        if (isStreaming) {
          void state.chatActions.markSessionSynced()
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

  get messages(): BizUIMessage[] {
    return this.#messages
  }

  set messages(newMessages: BizUIMessage[]) {
    startTransition(() => {
      this.#messages = [...newMessages]

      this.#eventEmitter.emit("messages", { messages: this.#messages })

      // Auto-persist messages when they change
      this.#persistMessages()
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
}
