import { createWithEqualityFn } from "zustand/traditional"

import type { BlockSlice } from "./slices/block.slice"
import { createBlockSlice } from "./slices/block.slice"
import type { ChatSlice } from "./slices/chat.slice"
import { createChatSlice } from "./slices/chat.slice"
import type { AIChatStoreInitial } from "./types"

export type AiChatStore = BlockSlice &
  ChatSlice & {
    reset: () => void
  }

export const createAIChatStore = (initialState?: Partial<AIChatStoreInitial>) => {
  return createWithEqualityFn<AiChatStore>((...a) => {
    const blockSlice = createBlockSlice(initialState?.blocks)(...a)
    const chatSlice = createChatSlice(...a)

    return {
      ...blockSlice,
      ...chatSlice,

      reset: () => {
        blockSlice.blockActions.resetContext()
        chatSlice.chatActions.resetChat()
      },
    }
  })
}
