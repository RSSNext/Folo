import type { BizUITools, ToolWithState } from "@folo-services/ai-tools"

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
  previewUrl?: string
  uploadStatus: "processing" | "uploading" | "completed" | "error"
  serverUrl?: string
  errorMessage?: string
  /** Upload progress percentage (0-100) */
  uploadProgress?: number
}

interface BaseContextBlock {
  id: string
}

export interface ValueContextBlock extends BaseContextBlock {
  type: "mainEntry" | "referEntry" | "referFeed" | "selectedText"
  value: string
}

export interface FileAttachmentContextBlock extends BaseContextBlock {
  type: "fileAttachment"
  attachment: FileAttachment
}

export type AIChatContextBlock = ValueContextBlock | FileAttachmentContextBlock

// Helper type for creating new blocks without id
export type AIChatContextBlockInput =
  | Omit<ValueContextBlock, "id">
  | Omit<FileAttachmentContextBlock, "id">

export interface AIChatStoreInitial {
  blocks: AIChatContextBlock[]
}

export interface AIChatContextBlocks {
  blocks: AIChatContextBlock[]
}

export type AIDisplayAnalyticsTool = ToolWithState<BizUITools["displayAnalytics"]>
export type AIDisplayFeedsTool = ToolWithState<BizUITools["displayFeeds"]>
export type AIDisplayEntriesTool = ToolWithState<BizUITools["displayEntries"]>
export type AIDisplaySubscriptionsTool = ToolWithState<BizUITools["displaySubscriptions"]>
export type AIDisplayFlowTool = ToolWithState<BizUITools["displayFlowChart"]>

export { type BizUIMessage, type BizUIMetadata, type BizUITools } from "@folo-services/ai-tools"
