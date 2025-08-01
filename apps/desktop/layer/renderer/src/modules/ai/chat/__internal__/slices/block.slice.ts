import { produce } from "immer"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import type { AIChatContextBlock } from "../types"

export interface BlockSlice {
  blocks: AIChatContextBlock[]
  blockActions: BlockSliceAction
}

export const createBlockSlice: (
  initialBlocks?: AIChatContextBlock[],
) => StateCreator<BlockSlice, [], [], BlockSlice> =
  (initialBlocks?: AIChatContextBlock[]) =>
  (...params) => {
    const defaultBlocks: AIChatContextBlock[] = initialBlocks || []

    return {
      blocks: defaultBlocks,
      blockActions: new BlockSliceAction(params),
    }
  }

class BlockSliceAction {
  constructor(private params: Parameters<StateCreator<BlockSlice, [], [], BlockSlice>>) {}

  get set() {
    return this.params[0]
  }

  get get() {
    return this.params[1]
  }
  addBlock(block: Omit<AIChatContextBlock, "id">) {
    const currentBlocks = this.get().blocks

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

    this.set(
      produce((state: BlockSlice) => {
        state.blocks.push({ ...block, id: nanoid(8) })
      }),
    )
  }

  removeBlock(id: string) {
    this.set(
      produce((state: BlockSlice) => {
        state.blocks = state.blocks.filter((block) => block.id !== id)
      }),
    )
  }

  updateBlock(id: string, updates: Partial<AIChatContextBlock>) {
    this.set(
      produce((state: BlockSlice) => {
        state.blocks = state.blocks.map((block) =>
          block.id === id ? { ...block, ...updates } : block,
        )
      }),
    )
  }

  clearBlocks() {
    this.set(
      produce((state: BlockSlice) => {
        state.blocks = []
      }),
    )
  }

  resetContext() {
    this.set(
      produce((state: BlockSlice) => {
        state.blocks = []
      }),
    )
  }

  getBlocks() {
    return this.get().blocks
  }
}
