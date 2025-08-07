import type { BizUITools, ToolWithState } from "@folo-services/ai-tools"

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
  previewUrl?: string
  uploadStatus: "processing" | "completed" | "error"
  errorMessage?: string
}

export interface AIChatContextBlock {
  id: string
  type: "mainEntry" | "referEntry" | "referFeed" | "selectedText" | "fileAttachment"
  value: string
  fileAttachment?: FileAttachment
}

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
