import { autoBindThis } from "@follow/utils/bind-this"
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

export class BlockSliceAction {
  constructor(private params: Parameters<StateCreator<BlockSlice, [], [], BlockSlice>>) {
    return autoBindThis(this)
  }

  static SPECIAL_TYPES = {
    mainEntry: "mainEntry",
    selectedText: "selectedText",
  }
  get set() {
    return this.params[0]
  }

  get get() {
    return this.params[1]
  }
  addBlock(block: Omit<AIChatContextBlock, "id">) {
    const currentBlocks = this.get().blocks

    // Only allow one SPECIAL_TYPES
    if (
      Object.values(BlockSliceAction.SPECIAL_TYPES).includes(block.type) &&
      currentBlocks.some((b) => b.type === block.type)
    ) {
      return
    }

    this.set(
      produce((state: BlockSlice) => {
        state.blocks.push({ ...block, id: BlockSliceAction.SPECIAL_TYPES[block.type] || nanoid(8) })
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

  addOrUpdateBlock(block: AIChatContextBlock) {
    const isExist = this.get().blocks.some((b) => b.id === block.id)
    if (isExist) {
      this.updateBlock(block.id, block)
    } else {
      this.addBlock(block)
    }
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
