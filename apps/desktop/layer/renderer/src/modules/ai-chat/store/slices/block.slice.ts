import { autoBindThis } from "@follow/utils/bind-this"
import { produce } from "immer"
import { nanoid } from "nanoid"
import type { StateCreator } from "zustand"

import { cleanupFileAttachment } from "../../utils/file-processing"
import type { AIChatContextBlock, AIChatContextBlockInput, FileAttachment } from "../types"

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
  addBlock(block: AIChatContextBlockInput) {
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
        const blockToRemove = state.blocks.find((block) => block.id === id)
        if (blockToRemove && blockToRemove.type === "fileAttachment") {
          cleanupFileAttachment(blockToRemove.attachment)
        }
        state.blocks = state.blocks.filter((block) => block.id !== id)
      }),
    )
  }

  updateBlock(id: string, updates: Partial<AIChatContextBlock>) {
    this.set(
      produce((state: BlockSlice) => {
        state.blocks = state.blocks.map((block) => {
          if (block.id !== id) return block

          // Handle discriminated union updates carefully
          if (updates.type && updates.type !== block.type) {
            // Type change - need to replace the entire block
            return { ...updates, id } as AIChatContextBlock
          } else {
            // Same type - safe to spread
            return { ...block, ...updates } as AIChatContextBlock
          }
        })
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
        // Clean up file attachments before clearing
        state.blocks.forEach((block) => {
          if (block.type === "fileAttachment") {
            cleanupFileAttachment(block.attachment)
          }
        })
        state.blocks = []
      }),
    )
  }

  resetContext() {
    this.set(
      produce((state: BlockSlice) => {
        // Clean up file attachments before resetting
        state.blocks.forEach((block) => {
          if (block.type === "fileAttachment") {
            cleanupFileAttachment(block.attachment)
          }
        })
        state.blocks = []
      }),
    )
  }

  getBlocks() {
    return this.get().blocks
  }

  // File attachment specific methods
  addFileAttachment(fileAttachment: FileAttachment) {
    const fileBlock: AIChatContextBlock = {
      id: fileAttachment.id,
      type: "fileAttachment",
      attachment: fileAttachment,
    }
    this.addBlock(fileBlock)
  }

  updateFileAttachment(fileId: string, updatedAttachment: FileAttachment) {
    this.set(
      produce((state: BlockSlice) => {
        const block = state.blocks.find((b) => b.id === fileId)
        if (block && block.type === "fileAttachment") {
          block.attachment = updatedAttachment
        }
      }),
    )
  }

  updateFileAttachmentStatus(
    fileId: string,
    status: FileAttachment["uploadStatus"],
    errorMessage?: string,
  ) {
    this.set(
      produce((state: BlockSlice) => {
        const block = state.blocks.find((b) => b.id === fileId)
        if (block && block.type === "fileAttachment") {
          block.attachment.uploadStatus = status
          if (errorMessage) {
            block.attachment.errorMessage = errorMessage
          }
        }
      }),
    )
  }

  removeFileAttachment(fileId: string) {
    this.removeBlock(fileId)
  }

  getFileAttachments() {
    return this.get().blocks.filter((block) => block.type === "fileAttachment")
  }

  hasFileAttachments() {
    return this.get().blocks.some((block) => block.type === "fileAttachment")
  }
}
