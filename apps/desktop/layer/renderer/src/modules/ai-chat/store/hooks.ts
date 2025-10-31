import type { BizUIMessage } from "@folo-services/ai-tools"
import { useShallow } from "zustand/shallow"

import { useAIChatStore } from "./AIChatContext"
import type { BlockSlice } from "./slices/block.slice"

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
