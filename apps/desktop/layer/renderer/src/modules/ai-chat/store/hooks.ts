import { use, useSyncExternalStore } from "react"
import { useShallow } from "zustand/shallow"

import { AIChatStoreContext, useAIChatStore } from "./AIChatContext"
import type { BlockSlice } from "./slices/block.slice"
import type { BizUIMessage } from "./types"

/**
 * Hook to get the current room ID (chat ID) from the AI chat store
 */
export const useCurrentChatId = () => {
  const store = useAIChatStore()
  return store((state) => state.chatId)
}

/**
 * Hook to get the current chat title from the AI chat store
 */
export const useCurrentTitle = () => {
  const store = useAIChatStore()
  return store((state) => state.currentTitle)
}

/**
 * Hook to get the chat actions
 */
export const useChatActions = () => {
  const store = useAIChatStore()
  return store((state) => state.chatActions)
}

/**
 * Hook to get the block actions
 */
export const useBlockActions = () => {
  const store = useAIChatStore()
  return store((state) => state.blockActions)
}

/**
 * Hook to get the current messages
 */
export const useMessages = () => {
  const store = useAIChatStore()
  return store((state) => state.messages)
}

export const useMessageByIdSelector = <T>(
  messageId: string,
  selector: (message: BizUIMessage) => T,
): T | undefined => {
  const store = useAIChatStore()
  return store(
    useShallow((state) => {
      const message = state.messages.find((message) => message.id === messageId)
      return message ? selector(message) : undefined
    }),
  )
}

/**
 * Hook to check if the chat has messages
 */
export const useHasMessages = () => {
  const store = useAIChatStore()
  return store((state) => state.messages.length > 0)
}

const subscribeToNothing = () => () => {}

/**
 * Like `useHasMessages`, but also usable outside an AI chat root (such as in a peek modal),
 * where it is always false
 */
export const useOptionalChatHasMessages = () => {
  const store = use(AIChatStoreContext)
  return useSyncExternalStore(
    store ? store.subscribe : subscribeToNothing,
    () => !!store && store.getState().messages.length > 0,
  )
}

/**
 * The last message when the user sent it, otherwise null. Unlike `useMessages`, it doesn't
 * change on every streamed chunk of an answer.
 */
export const useLastUserMessage = () => {
  const store = useAIChatStore()
  return store((state) => {
    const lastMessage = state.messages.at(-1)
    return lastMessage?.role === "user" ? lastMessage : null
  })
}

export const useIsLocalChat = () => {
  const store = useAIChatStore()
  return store((state) => state.isLocal)
}

export const useSyncStatus = () => {
  const store = useAIChatStore()
  return store((state) => state.syncStatus)
}

export const useSyncStateActions = () => {
  const store = useAIChatStore()
  return store((state) => state.chatActions)
}

export const useChatBlockActions = () => useAIChatStore()((state) => state.blockActions)
/**
 * Hook to get the chat status
 */
export const useChatStatus = () => {
  const store = useAIChatStore()
  return store((state) => state.status)
}

/**
 * Hook to get the chat error
 */
export const useChatError = () => {
  const store = useAIChatStore()
  return store((state) => state.error)
}

/**
 * Hook to get the chat scene
 */
export const useChatScene = () => {
  const store = useAIChatStore()
  return store((state) => state.scene)
}

export const useChatBlockSelector = <T>(selector: (state: Pick<BlockSlice, "blocks">) => T) => {
  const store = useAIChatStore()
  return store(useShallow((state) => selector(state)))
}
