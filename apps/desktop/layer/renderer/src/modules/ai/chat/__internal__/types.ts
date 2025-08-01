import type { BizUITools, ToolWithState } from "@folo-services/ai-tools"

export interface AIChatContextBlock {
  id: string
  type: "mainEntry" | "referEntry" | "referFeed" | "selectedText"
  value: string
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

export { type BizUIMessage, type BizUIMetadata, type BizUITools } from "@folo-services/ai-tools"
