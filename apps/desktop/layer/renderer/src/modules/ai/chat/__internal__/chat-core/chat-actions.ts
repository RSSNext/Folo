import type { ChatStatus } from "ai"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { AIPersistService } from "../../services"
import { createChatTransport } from "../transport"
import type { BizUIMessage } from "../types"
import { ZustandChat } from "./chat-instance"
import type { ChatSlice } from "./types"

export class ChatSliceActions {
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

      // Load session and messages in parallel to reduce database queries
      const { session: chatSession, messages } =
        await AIPersistService.loadSessionWithMessages(chatId)

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
