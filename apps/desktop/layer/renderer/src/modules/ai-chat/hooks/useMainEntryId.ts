import { useAIChatStore } from "../store/AIChatContext"

/**
 * Hook to get the current main entry ID from the AI chat store.
 * Returns undefined if no entry context is available.
 *
 * This hook accesses the mainEntry block that gets set when viewing an entry,
 * enabling context-aware AI chat features.
 */
export const useMainEntryId = (): string | undefined => {
  return useAIChatStore()((state) => {
    const block = state.blocks.find((b) => b.type === "mainEntry")
    return block && block.type === "mainEntry" ? block.value : undefined
  })
}
