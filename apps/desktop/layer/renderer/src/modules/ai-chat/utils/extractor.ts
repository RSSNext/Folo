import type { AIChatContextBlock, FileAttachmentContextBlock } from "../store/types"

type AIMessageDataBlockPart = {
  type: "data-block"
  data: AIChatContextBlock[]
}
export const isDataBlockPart = (part: unknown): part is AIMessageDataBlockPart => {
  return !!part && typeof part === "object" && "type" in part && part.type === "data-block"
}

// Narrow a context block to the file attachment block
export const isFileAttachmentBlock = (
  block: AIChatContextBlock,
): block is FileAttachmentContextBlock => {
  return block.type === "fileAttachment"
}

export const findFileAttachmentBlock = (
  part: AIMessageDataBlockPart,
  attachmentId: string,
): FileAttachmentContextBlock | undefined => {
  if (!isDataBlockPart(part)) return

  for (const block of part.data) {
    if (isFileAttachmentBlock(block) && block.attachment.id === attachmentId) {
      return block
    }
  }
  return
}
