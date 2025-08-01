import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { AIPersistService } from "../../services"
import { generateChatTitle } from "../../utils/titleGeneration"
import { ChatSliceActions } from "../chat-core/chat-actions"
import { ZustandChat } from "../chat-core/chat-instance"
import type { ChatSlice } from "../chat-core/types"
import { createChatTransport } from "../transport"
import type { BizUIMessage } from "../types"

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
