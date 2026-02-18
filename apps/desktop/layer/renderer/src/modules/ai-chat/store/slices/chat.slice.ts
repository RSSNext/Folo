import type { IdGenerator } from "ai"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { ChatSliceActions } from "../chat-core/chat-actions"
import { ZustandChat } from "../chat-core/chat-instance"
import type { ChatSlice } from "../chat-core/types"
import { createChatTitleHandler, createChatTransport } from "../transport"

export const createChatSlice: (options: {
  chatId?: string
  generateId?: IdGenerator
  isLocal?: boolean
  syncStatus?: "local" | "synced"
}) => StateCreator<ChatSlice, [], [], ChatSlice> =
  (options) =>
  (...params) => {
    const [set, get] = params
    const { chatId, generateId, isLocal, syncStatus } = options

    const nextChatId = chatId || nanoid()
    const chatInstance = new ZustandChat(
      {
        id: nextChatId,
        messages: [],
        transport: createChatTransport({
          titleHandler: createChatTitleHandler({
            chatId: nextChatId,
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

    const chatActions = new ChatSliceActions(params, {
      chatInstance,
      hasChatId: !!chatId,
    })

    return {
      chatId: nextChatId,
      messages: [],
      status: "ready",
      error: undefined,
      isStreaming: false,
      isLocal: isLocal ?? true,
      syncStatus: syncStatus ?? (isLocal === false ? "synced" : "local"),
      currentTitle: undefined,
      chatInstance,
      chatActions,
      scene: "general",
      timelineSummaryManualOverride: false,
      timelineSummaryWasInAutoContext: false,
    }
  }
