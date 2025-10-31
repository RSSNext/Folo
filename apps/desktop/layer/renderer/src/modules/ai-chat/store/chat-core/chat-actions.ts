import { autoBindThis } from "@follow/utils/bind-this"
import type { ChatRequestOptions, ChatStatus } from "ai"
import { merge } from "es-toolkit/compat"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { AIPersistService } from "../../services"
import { createChatTitleHandler, createChatTransport } from "../transport"
import type { BizUIMessage, SendingUIMessage } from "../types"
import { ZustandChat } from "./chat-instance"
import type { ChatSlice } from "./types"

export class ChatSliceActions {
  // Hold reference to the most recently constructed (active) ChatSliceActions instance
  private static _current: ChatSliceActions | null = null

  /**
   * Get the currently active ChatSliceActions instance.
   *
   * WARNING: Anti-pattern — temporary global accessor used. Do NOT use in new code.
   * This may be removed/refactored.
   */
  static getActiveInstance(): ChatSliceActions | null {
    if (!this._current) return null
    return this._current
  }

  /**
   * See warning above — this setter exists solely for the same limited purpose.
   */
  static setActiveInstance(instance: ChatSliceActions | null) {
    this._current = instance
  }

  constructor(
    private params: Parameters<StateCreator<ChatSlice, [], [], ChatSlice>>,
    private chatInstance: ZustandChat,
  ) {
    this.chatInstance.resumeStream()
    return autoBindThis(this)
  }

  get set() {
    return this.params[0]
  }

  get get() {
    return this.params[1]
  }

  private computeSyncStatus(isLocal: boolean): "local" | "synced" {
    return isLocal ? "local" : "synced"
  }

  private setSyncState(isLocal: boolean) {
    this.set((state) => {
      const nextStatus = this.computeSyncStatus(isLocal)
      if (state.isLocal === isLocal && state.syncStatus === nextStatus) {
        return state
      }
      return {
        isLocal,
        syncStatus: nextStatus,
      }
    })
  }

  async markSessionSynced() {
    const currentChatId = this.get().chatId
    if (!currentChatId) {
      return
    }

    if (!this.get().isLocal) {
      return
    }

    this.setSyncState(false)

    try {
      await AIPersistService.markSessionSynced(currentChatId)
    } catch (error) {
      console.error("Failed to mark chat session as synced:", error)
    }
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
  getChatInstance = (): ZustandChat => {
    return this.chatInstance
  }

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

  private createTransportTitleHandler = (chatId: string) => {
    return createChatTitleHandler({
      chatId,
      getActiveChatId: () => this.get().chatId,
      onTitleChange: (title) => {
        this.setCurrentTitle(title)
      },
    })
  }

  // Edit chat title
  editChatTitle = async (newTitle: string) => {
    const currentChatId = this.getCurrentChatId()
    if (!currentChatId) {
      throw new Error("No active chat to edit title for")
    }

    const trimmedTitle = newTitle.trim()
    const currentTitle = this.getCurrentTitle()

    // If no changes, return early
    if (trimmedTitle === currentTitle) {
      return
    }

    try {
      // Optimistic update
      this.setCurrentTitle(trimmedTitle)

      // Persist to database
      await AIPersistService.updateSessionTitle(currentChatId, trimmedTitle)
    } catch (error) {
      // Rollback on error
      this.setCurrentTitle(currentTitle)
      console.error("Failed to update chat title:", error)
      throw error
    }
  }

  // Core chat actions using AI SDK AbstractChat methods
  sendMessage = async (message: string | SendingUIMessage, options?: ChatRequestOptions) => {
    try {
      // Convert string to message object if needed
      const messageObj =
        typeof message === "string"
          ? ({ parts: [{ type: "text", text: message }] } as Parameters<
              typeof this.chatInstance.sendMessage
            >[0])
          : (message as Parameters<typeof this.chatInstance.sendMessage>[0])

      // Use the AI SDK's sendMessage method
      const finalOptions = merge(
        {
          body: { scene: this.get().scene },
        },
        options,
      )

      return await this.chatInstance.sendMessage(messageObj, finalOptions)
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  regenerate = async ({ messageId, ...options }: { messageId: string } & ChatRequestOptions) => {
    try {
      // Use the AI SDK's regenerate method
      const finalOptions = merge(
        {
          body: { scene: this.get().scene },
        },
        options,
      )
      return await this.chatInstance.regenerate({ messageId, ...finalOptions })
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
    const newChatInstance = new ZustandChat(
      {
        id: newChatId,
        messages: [],
        transport: createChatTransport({
          titleHandler: this.createTransportTitleHandler(newChatId),
        }),
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
      isLocal: true,
      syncStatus: "local",
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
      const newChatInstance = new ZustandChat(
        {
          id: chatId,
          messages,
          transport: createChatTransport({
            titleHandler: this.createTransportTitleHandler(chatId),
          }),
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
        isLocal: chatSession ? chatSession.isLocal : true,
        syncStatus: chatSession ? chatSession.syncStatus : "local",
      }))

      newChatInstance.resumeStream()
      // Update the reference
      this.chatInstance = newChatInstance
    } catch (error) {
      console.error("Failed to switch to chat:", error)
      this.setError(error as Error)
      this.setStatus("ready")
      throw error
    }
  }

  setScene = (scene: ChatSlice["scene"]) => {
    this.set((state) => ({ ...state, scene }))
  }

  setTimelineSummaryManualOverride = (override: boolean) => {
    this.set((state) => {
      if (state.timelineSummaryManualOverride === override) {
        return state
      }
      return { ...state, timelineSummaryManualOverride: override }
    })
  }

  getTimelineSummaryManualOverride = () => {
    return this.get().timelineSummaryManualOverride
  }
}
