import { useAIChatStore } from "./AIChatContext"

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

/**
 * Hook to check if the chat has messages
 */
export const useHasMessages = () => {
  const store = useAIChatStore()
  return store((state) => state.messages.length > 0)
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
