import type { IdGenerator } from "ai"
import type { StateCreator } from "zustand"

import { ChatSliceActions } from "../chat-core/chat-actions"
import { ZustandChat } from "../chat-core/chat-instance"
import type { ChatSlice } from "../chat-core/types"
import { createChatTitleHandler, createChatTransport } from "../transport"

export const createChatSlice: (options: {
  chatId: string
  generateId?: IdGenerator
}) => StateCreator<ChatSlice, [], [], ChatSlice> =
  (options) =>
  (...params) => {
    const [set, get] = params
    const { chatId, generateId } = options

    const chatInstance = new ZustandChat(
      {
        id: chatId,
        messages: [],
        transport: createChatTransport({
          titleHandler: createChatTitleHandler({
            chatId,
            getActiveChatId: () => get().chatId,
            onTitleChange: (title) => {
              set({
                currentTitle: title,
              })
            },
          }),
        }),
        generateId,
      },
      set,
    )

    const chatActions = new ChatSliceActions(params, chatInstance)

    return {
      chatId,
      messages: [],
      status: "ready",
      error: undefined,
      isStreaming: false,
      currentTitle: undefined,
      chatInstance,
      chatActions,
      scene: "general",
      timelineSummaryManualOverride: false,
    }
  }
