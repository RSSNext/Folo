import type { ChatInit, ChatState, ChatStatus } from "ai"
import { AbstractChat } from "ai"
import { throttle } from "es-toolkit/compat"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { AIPersistService } from "../../services"
import { generateChatTitle } from "../../utils/titleGeneration"
import { createChatTransport } from "../transport"
import type { BizUIMessage } from "../types"

// Event types and payloads
interface ChatStateEvents<UI_MESSAGE extends BizUIMessage> {
  messages: { messages: UI_MESSAGE[] }
  status: { status: ChatStatus }
  error: { error: Error | undefined }
}

type ChatStateEventType = keyof ChatStateEvents<any>

// Event emitter for AI chat state changes with typed payloads
class ChatStateEventEmitter<UI_MESSAGE extends BizUIMessage> {
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

// Zustand Chat State that implements AI SDK ChatState interface
class ZustandChatState<UI_MESSAGE extends BizUIMessage> implements ChatState<UI_MESSAGE> {
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

// Custom Chat class that uses Zustand-integrated state
export class ZustandChat<UI_MESSAGE extends BizUIMessage> extends AbstractChat<UI_MESSAGE> {
  override state: ZustandChatState<UI_MESSAGE>
  #unsubscribeFns: (() => void)[] = []

  constructor(
    { messages, ...init }: ChatInit<UI_MESSAGE>,
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
                if (get().chatId === chatId) {
                  chatActions.setCurrentTitle(title)
                }
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
  setMessages = (
    messagesParam: BizUIMessage[] | ((messages: BizUIMessage[]) => BizUIMessage[]),
  ) => {
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

  updateMessage = (id: string, updates: Partial<BizUIMessage>) => {
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

  // Getter
  getMessages = (): BizUIMessage[] => {
    return this.chatInstance.chatState.messages
  }

  // Status management (delegating to chat instance state)
  setStatus = (status: ChatStatus) => {
    this.chatInstance.chatState.status = status
  }

  setError = (error: Error | undefined) => {
    this.chatInstance.chatState.error = error
  }

  setStreaming = (streaming: boolean) => {
    this.chatInstance.chatState.status = streaming ? "streaming" : "ready"
  }

  // Title management
  setCurrentTitle = (title: string | undefined) => {
    this.set((state) => ({ ...state, currentTitle: title }))
  }

  getCurrentTitle = (): string | undefined => {
    return this.get().currentTitle
  }

  getCurrentChatId = (): string | null => {
    return this.get().chatId
  }

  // Core chat actions using AI SDK AbstractChat methods
  sendMessage = async (message: string | BizUIMessage) => {
    try {
      // Convert string to message object if needed
      const messageObj =
        typeof message === "string"
          ? ({ parts: [{ type: "text", text: message }] } as Parameters<
              typeof this.chatInstance.sendMessage
            >[0])
          : (message as Parameters<typeof this.chatInstance.sendMessage>[0])

      // Use the AI SDK's sendMessage method
      const response = await this.chatInstance.sendMessage(messageObj)
      return response
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  regenerate = async ({ messageId }: { messageId: string }) => {
    try {
      // Use the AI SDK's regenerate method
      const response = await this.chatInstance.regenerate({ messageId })
      return response
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  stop = () => {
    // Use AI SDK's stop method
    this.chatInstance.stop()
  }

  resumeStream = async () => {
    try {
      // Use AI SDK's resumeStream method
      await this.chatInstance.resumeStream()
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  resetChat = () => {
    // Reset through the chat instance state
    this.chatInstance.chatState.messages = []
    this.chatInstance.chatState.error = undefined
    this.chatInstance.chatState.status = "ready"
    // Reset title
    this.setCurrentTitle(undefined)
  }

  newChat = () => {
    const newChatId = nanoid()

    // Cleanup old chat instance
    this.chatInstance.destroy()

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

  switchToChat = async (chatId: string) => {
    try {
      // Set loading state (using ready as there's no loading status in ChatStatus)
      this.setStatus("ready")
      this.setError(undefined)

      // Load messages from persistence service
      const messages = await AIPersistService.loadUIMessages(chatId)

      // Load chat session details to get title (direct SQL query)
      const chatSession = await AIPersistService.getChatSession(chatId)

      // Cleanup old chat instance
      this.chatInstance.destroy()

      // Create new chat instance with loaded messages
      const newChatInstance = new ZustandChat<BizUIMessage>(
        {
          id: chatId,
          messages,
          transport: createChatTransport(),
        },
        this.set,
      )

      // Update store state
      this.set((state) => ({
        ...state,
        chatId,
        messages: [...messages],
        status: "ready" as ChatStatus,
        error: undefined,
        isStreaming: false,
        currentTitle: chatSession?.title || undefined,
        chatInstance: newChatInstance,
      }))

      // Update the reference
      this.chatInstance = newChatInstance
    } catch (error) {
      console.error("Failed to switch to chat:", error)
      this.setError(error as Error)
      this.setStatus("ready")
      throw error
    }
  }
}

export { type ChatStatus } from "ai"
