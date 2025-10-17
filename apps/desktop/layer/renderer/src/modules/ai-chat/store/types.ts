import type { BizUIMetadata, BizUITools, ToolWithState } from "@folo-services/ai-tools"
import type { IdGenerator, UIMessage, UIMessagePart } from "ai"

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl?: string
  previewUrl?: string
  uploadStatus?: "processing" | "uploading" | "completed" | "error"
  serverUrl?: string
  errorMessage?: string
  /** Upload progress percentage (0-100) */
  uploadProgress?: number
}

interface BaseContextBlock {
  id: string
}

export type ValueContextBlockType =
  | "mainView"
  | "mainEntry"
  | "mainFeed"
  | "selectedText"
  | "unreadOnly"
export interface AbstractValueContextBlock<T extends string> extends BaseContextBlock {
  type: T
  value: string
}

export type ValueContextBlock = AbstractValueContextBlock<ValueContextBlockType>

export interface FileAttachmentContextBlock extends BaseContextBlock {
  type: "fileAttachment"
  attachment: FileAttachment
}

export type AIChatContextBlock = ValueContextBlock | FileAttachmentContextBlock

// Helper type for creating new blocks without id
export type AIChatContextBlockInput =
  | Omit<ValueContextBlock, "id">
  | Omit<FileAttachmentContextBlock, "id">

export type AIChatContextBlockType = AIChatContextBlock["type"]

export interface AIChatStoreInitial {
  blocks: AIChatContextBlock[]
  chatId?: string
  generateId?: IdGenerator
}

export interface AIChatContextBlocks {
  blocks: AIChatContextBlock[]
}

export type AIDisplayFeedTool = ToolWithState<BizUITools["displayFeed"]>
export type AIDisplayEntriesTool = ToolWithState<BizUITools["displayEntries"]>
export type AIDisplaySubscriptionsTool = ToolWithState<BizUITools["displaySubscriptions"]>
export type AIDisplayFlowTool = ToolWithState<BizUITools["displayFlowChart"]>

export { type BizUIMetadata, type BizUITools } from "@folo-services/ai-tools"
export type BizUIDataTypes = {
  "rich-text": {
    state: string
    text: string
  }
  block: AIChatContextBlock[]
}
export type BizUIMessage = UIMessage<BizUIMetadata, BizUIDataTypes, BizUITools> & {
  createdAt: Date
}

export type BizUIMessagePart = UIMessagePart<BizUIDataTypes, BizUITools>

export type SendingUIMessage = Omit<BizUIMessage, "createdAt">
