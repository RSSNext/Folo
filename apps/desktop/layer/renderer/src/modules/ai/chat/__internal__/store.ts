import { produce } from "immer"
import { nanoid } from "nanoid"
import { createWithEqualityFn } from "zustand/traditional"

import type { AIChatContextBlock, AIChatContextInfo } from "./types"
import { blocksToContextInfo, contextInfoToBlocks } from "./utils"

export interface AiChatContextStore {
  state: AIChatContextInfo
  blocks: AIChatContextBlock[]
  // Block management methods
  addBlock: (block: Omit<AIChatContextBlock, "id">) => void
  removeBlock: (id: string) => void
  updateBlock: (id: string, updates: Partial<AIChatContextBlock>) => void
  clearBlocks: () => void
  // Context info management methods
  setMainEntryId: (entryId?: string) => void
  addReferEntryId: (entryId: string) => void
  removeReferEntryId: (entryId: string) => void
  addReferFeedId: (feedId: string) => void
  removeReferFeedId: (feedId: string) => void
  setSelectedText: (selectedText?: string) => void
  // Legacy compatibility
  setEntryId: (entryId?: string) => void
  setFeedId: (feedId?: string) => void
  reset: () => void
  // Sync methods
  syncBlocksToContext: () => void
  syncContextToBlocks: () => void
}

export const createAIChatContextStore = (initialState?: Partial<AIChatContextInfo>) => {
  const defaultState: AIChatContextInfo = {
    mainEntryId: undefined,
    referEntryIds: [],
    referFeedIds: [],
    selectedText: undefined,
  }

  const defaultBlocks: AIChatContextBlock[] = []

  const state: AIChatContextInfo = {
    mainEntryId: initialState?.mainEntryId,
    referEntryIds: initialState?.referEntryIds || [],
    referFeedIds: initialState?.referFeedIds || [],
    selectedText: initialState?.selectedText,
  }

  return createWithEqualityFn<AiChatContextStore>((set, get) => ({
    state,
    blocks: defaultBlocks,

    // Block management methods
    addBlock: (block: Omit<AIChatContextBlock, "id">) => {
      // Check for uniqueness constraints
      const currentBlocks = get().blocks

      // Only allow one mainEntry
      if (block.type === "mainEntry" && currentBlocks.some((b) => b.type === "mainEntry")) {
        return
      }

      // Only allow one selectedText
      if (block.type === "selectedText" && currentBlocks.some((b) => b.type === "selectedText")) {
        return
      }

      // Prevent duplicate referEntry or referFeed
      if (
        block.type === "referEntry" &&
        block.value &&
        currentBlocks.some((b) => b.type === "referEntry" && b.value === block.value)
      ) {
        return
      }

      if (
        block.type === "referFeed" &&
        block.value &&
        currentBlocks.some((b) => b.type === "referFeed" && b.value === block.value)
      ) {
        return
      }

      set(
        produce((s) => {
          s.blocks.push({ ...block, id: nanoid(8) })
        }),
      )

      // Sync to context info
      get().syncBlocksToContext()
    },

    removeBlock: (id: string) => {
      set(
        produce((s: AiChatContextStore) => {
          s.blocks = s.blocks.filter((block) => block.id !== id)
        }),
      )

      // Sync to context info
      get().syncBlocksToContext()
    },

    updateBlock: (id: string, updates: Partial<AIChatContextBlock>) => {
      set(
        produce((s: AiChatContextStore) => {
          s.blocks = s.blocks.map((block) => (block.id === id ? { ...block, ...updates } : block))
        }),
      )

      // Sync to context info
      get().syncBlocksToContext()
    },

    clearBlocks: () => {
      set(
        produce((s: AiChatContextStore) => {
          s.blocks = defaultBlocks
        }),
      )
      get().syncBlocksToContext()
    },

    // Context info management methods
    setMainEntryId: (entryId?: string) => {
      set((s) => ({ state: { ...s.state, mainEntryId: entryId } }))
      get().syncContextToBlocks()
    },

    addReferEntryId: (entryId: string) => {
      set((s) => ({
        state: {
          ...s.state,
          referEntryIds: [...(s.state.referEntryIds || []), entryId],
        },
      }))
      get().syncContextToBlocks()
    },

    removeReferEntryId: (entryId: string) => {
      set((s) => ({
        state: {
          ...s.state,
          referEntryIds: (s.state.referEntryIds || []).filter((id) => id !== entryId),
        },
      }))
      get().syncContextToBlocks()
    },

    addReferFeedId: (feedId: string) => {
      set((s) => ({
        state: {
          ...s.state,
          referFeedIds: [...(s.state.referFeedIds || []), feedId],
        },
      }))
      get().syncContextToBlocks()
    },

    removeReferFeedId: (feedId: string) => {
      set((s) => ({
        state: {
          ...s.state,
          referFeedIds: (s.state.referFeedIds || []).filter((id) => id !== feedId),
        },
      }))
      get().syncContextToBlocks()
    },

    setSelectedText: (selectedText?: string) => {
      set((s) => ({ state: { ...s.state, selectedText } }))
      get().syncContextToBlocks()
    },

    // Legacy compatibility
    setEntryId: (entryId?: string) => {
      get().setMainEntryId(entryId)
    },

    setFeedId: (feedId?: string) => {
      if (feedId) {
        get().addReferFeedId(feedId)
      }
    },

    reset: () => {
      set(() => ({ state: defaultState, blocks: defaultBlocks }))
    },

    // Sync methods
    syncBlocksToContext: () => {
      const contextInfo = blocksToContextInfo(get().blocks)
      set((s) => ({ state: { ...s.state, ...contextInfo } }))
    },

    syncContextToBlocks: () => {
      const blocks = contextInfoToBlocks(get().state)
      set(() => ({ blocks }))
    },
  }))
}
