import type { ChatInit, ChatState, ChatStatus } from "ai"
import { AbstractChat } from "ai"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { AIPersistService } from "../../services"
import { generateChatTitle } from "../../utils/titleGeneration"
import { createChatTransport } from "../transport"
import type { BizUIMessage } from "../types"

// Zustand Chat State that implements AI SDK ChatState interface
class ZustandChatState<UI_MESSAGE extends BizUIMessage> implements ChatState<UI_MESSAGE> {
  #messages: UI_MESSAGE[]
  #status: ChatStatus = "ready"
  #error: Error | undefined = undefined

  #messagesCallbacks = new Set<() => void>()
  #statusCallbacks = new Set<() => void>()
  #errorCallbacks = new Set<() => void>()

  constructor(
    initialMessages: UI_MESSAGE[] = [],
    private updateZustandState: (updater: (state: ChatSlice) => ChatSlice) => void,
  ) {
    this.#messages = initialMessages
  }

  get status(): ChatStatus {
    return this.#status
  }

  set status(newStatus: ChatStatus) {
    this.#status = newStatus
    this.#callStatusCallbacks()
    // Sync to Zustand
    this.updateZustandState((state) => ({
      ...state,
      status: newStatus,
      isStreaming: newStatus === "streaming",
    }))
  }

  get error(): Error | undefined {
    return this.#error
  }

  set error(newError: Error | undefined) {
    this.#error = newError
    this.#callErrorCallbacks()
    // Sync to Zustand
    this.updateZustandState((state) => ({
      ...state,
      error: newError,
    }))
  }

  get messages(): UI_MESSAGE[] {
    return this.#messages
  }

  set messages(newMessages: UI_MESSAGE[]) {
    this.#messages = [...newMessages]
    this.#callMessagesCallbacks()
    // Sync to Zustand
    this.updateZustandState((state) => ({
      ...state,
      messages: [...newMessages],
    }))
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.#messages = this.#messages.concat(message)
    this.#callMessagesCallbacks()
    // Sync to Zustand
    this.updateZustandState((state) => ({
      ...state,
      messages: [...this.#messages],
    }))
  }

  popMessage = () => {
    this.#messages = this.#messages.slice(0, -1)
    this.#callMessagesCallbacks()
    // Sync to Zustand
    this.updateZustandState((state) => ({
      ...state,
      messages: [...this.#messages],
    }))
  }

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this.#messages = [
      ...this.#messages.slice(0, index),
      // Deep clone the message to ensure React detects changes
      this.snapshot(message),
      ...this.#messages.slice(index + 1),
    ]
    this.#callMessagesCallbacks()
    // Sync to Zustand
    this.updateZustandState((state) => ({
      ...state,
      messages: [...this.#messages],
    }))
  }

  snapshot = <T>(value: T): T => structuredClone(value)

  // Callback registration methods (using symbol-like names from AI SDK)
  "~registerMessagesCallback" = (onChange: () => void, throttleWaitMs?: number): (() => void) => {
    const callback = throttleWaitMs ? this.throttle(onChange, throttleWaitMs) : onChange
    this.#messagesCallbacks.add(callback)
    return () => {
      this.#messagesCallbacks.delete(callback)
    }
  }

  "~registerStatusCallback" = (onChange: () => void): (() => void) => {
    this.#statusCallbacks.add(onChange)
    return () => {
      this.#statusCallbacks.delete(onChange)
    }
  }

  "~registerErrorCallback" = (onChange: () => void): (() => void) => {
    this.#errorCallbacks.add(onChange)
    return () => {
      this.#errorCallbacks.delete(onChange)
    }
  }

  #callMessagesCallbacks = () => {
    this.#messagesCallbacks.forEach((callback) => callback())
  }

  #callStatusCallbacks = () => {
    this.#statusCallbacks.forEach((callback) => callback())
  }

  #callErrorCallbacks = () => {
    this.#errorCallbacks.forEach((callback) => callback())
  }

  // Simple throttle implementation
  private throttle = (func: () => void, wait: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return () => {
      if (timeout === null) {
        timeout = setTimeout(() => {
          func()
          timeout = null
        }, wait)
      }
    }
  }
}

// Custom Chat class that uses Zustand-integrated state
export class ZustandChat<UI_MESSAGE extends BizUIMessage> extends AbstractChat<UI_MESSAGE> {
  #state: ZustandChatState<UI_MESSAGE>

  constructor(
    { messages, ...init }: ChatInit<UI_MESSAGE>,
    updateZustandState: (updater: (state: ChatSlice) => ChatSlice) => void,
  ) {
    const state = new ZustandChatState(messages, updateZustandState)
    super({ ...init, state })
    this.#state = state
  }

  "~registerMessagesCallback" = (onChange: () => void, throttleWaitMs?: number): (() => void) =>
    this.#state["~registerMessagesCallback"](onChange, throttleWaitMs)

  "~registerStatusCallback" = (onChange: () => void): (() => void) =>
    this.#state["~registerStatusCallback"](onChange)

  "~registerErrorCallback" = (onChange: () => void): (() => void) =>
    this.#state["~registerErrorCallback"](onChange)

  // Public getter for state access
  get chatState() {
    return this.#state
  }
}

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

  // AI SDK Chat instance
  chatInstance: ZustandChat<BizUIMessage>

  // Actions
  chatActions: ChatSliceActions
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (...params) => {
  const [set, get] = params
  const chatId = nanoid()

  // Create chat instance with Zustand integration
  const chatInstance = new ZustandChat<BizUIMessage>(
    {
      id: chatId,
      messages: [],
      transport: createChatTransport(),
      onFinish: async (options) => {
        const { message } = options

        // Only trigger title generation for assistant messages (AI responses)
        if (message.role !== "assistant") return

        // Get current messages to check if this is the first AI response
        const allMessages = chatInstance.chatState.messages

        // Check if we have exactly 2 messages (1 user + 1 assistant = first exchange)
        // Or if we have 2+ messages and this is the first assistant message
        const assistantMessages = allMessages.filter((m) => m.role === "assistant")
        const isFirstAIResponse = assistantMessages.length === 1

        if (isFirstAIResponse && allMessages.length >= 2) {
          try {
            // Generate title using the first user message and first AI response
            const firstExchange = allMessages.slice(0, 2)

            const title = await generateChatTitle(firstExchange)

            if (title && chatId) {
              try {
                await AIPersistService.updateSessionTitle(chatId, title)
                if (get().chatId === chatId) chatActions.setCurrentTitle(title)
              } catch (error) {
                console.error("Failed to update session title:", error)
              }
            }
          } catch (error) {
            console.error("Failed to generate chat title:", error)
          }
        }
      },
    },
    set, // Pass set function for state updates
  )

  // Create actions
  const chatActions = new ChatSliceActions(params, chatInstance)

  return {
    // Chat state
    chatId,
    messages: [],
    status: "ready",
    error: undefined,
    isStreaming: false,
    currentTitle: undefined,
    chatInstance,
    chatActions,
  }
}

class ChatSliceActions {
  constructor(
    private params: Parameters<StateCreator<ChatSlice, [], [], ChatSlice>>,
    private chatInstance: ZustandChat<BizUIMessage>,
  ) {}

  get set() {
    return this.params[0]
  }

  get get() {
    return this.params[1]
  }

  // Direct message management methods (delegating to chat instance state)
  setMessages(messagesParam: BizUIMessage[] | ((messages: BizUIMessage[]) => BizUIMessage[])) {
    if (typeof messagesParam === "function") {
      this.chatInstance.chatState.messages = messagesParam(this.chatInstance.chatState.messages)
    } else {
      this.chatInstance.chatState.messages = messagesParam
    }
  }

  pushMessage = (message: BizUIMessage) => {
    this.chatInstance.chatState.pushMessage(message)
  }

  popMessage = () => {
    this.chatInstance.chatState.popMessage()
  }

  replaceMessage = (index: number, message: BizUIMessage) => {
    this.chatInstance.chatState.replaceMessage(index, message)
  }

  updateMessage(id: string, updates: Partial<BizUIMessage>) {
    const messageIndex = this.chatInstance.chatState.messages.findIndex(
      (msg: BizUIMessage) => msg.id === id,
    )
    if (messageIndex !== -1) {
      const message = this.chatInstance.chatState.messages[messageIndex]
      if (message) {
        const updatedMessage = { ...message, ...updates }
        this.replaceMessage(messageIndex, updatedMessage)
      }
    }
  }

  // Status management (delegating to chat instance state)
  setStatus(status: ChatStatus) {
    this.chatInstance.chatState.status = status
  }

  setError(error: Error | undefined) {
    this.chatInstance.chatState.error = error
  }

  setStreaming(streaming: boolean) {
    this.chatInstance.chatState.status = streaming ? "streaming" : "ready"
  }

  // Title management
  setCurrentTitle(title: string | undefined) {
    this.set((state) => ({ ...state, currentTitle: title }))
  }

  getCurrentTitle(): string | undefined {
    return this.get().currentTitle
  }

  getCurrentRoomId(): string | null {
    return this.get().chatId
  }

  // Core chat actions using AI SDK AbstractChat methods
  async sendMessage(message: string | BizUIMessage) {
    try {
      // Convert string to message object if needed
      const messageObj =
        typeof message === "string"
          ? ({ text: message } as Parameters<typeof this.chatInstance.sendMessage>[0])
          : (message as Parameters<typeof this.chatInstance.sendMessage>[0])

      // Use the AI SDK's sendMessage method
      const response = await this.chatInstance.sendMessage(messageObj)
      return response
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  async regenerate({ messageId }: { messageId: string }) {
    try {
      // Use the AI SDK's regenerate method
      const response = await this.chatInstance.regenerate({ messageId })
      return response
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  stop() {
    // Use AI SDK's stop method
    this.chatInstance.stop()
  }

  async resumeStream() {
    try {
      // Use AI SDK's resumeStream method
      await this.chatInstance.resumeStream()
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  addToolResult(toolCallId: string, result: any) {
    // Use AI SDK's addToolResult method
    this.chatInstance.addToolResult({ toolCallId, output: result })
  }

  resetChat() {
    // Reset through the chat instance state
    this.chatInstance.chatState.messages = []
    this.chatInstance.chatState.error = undefined
    this.chatInstance.chatState.status = "ready"
    // Reset title
    this.setCurrentTitle(undefined)
  }

  newChat() {
    const newChatId = nanoid()

    // Create new chat instance
    const newChatInstance = new ZustandChat<BizUIMessage>(
      {
        id: newChatId,
        messages: [],
        transport: createChatTransport(),
      },
      this.set,
    )

    // Update store state
    this.set((state) => ({
      ...state,
      chatId: newChatId,
      messages: [],
      status: "ready" as ChatStatus,
      error: undefined,
      isStreaming: false,
      currentTitle: undefined,
      chatInstance: newChatInstance,
    }))

    // Update the reference
    this.chatInstance = newChatInstance
  }
}
