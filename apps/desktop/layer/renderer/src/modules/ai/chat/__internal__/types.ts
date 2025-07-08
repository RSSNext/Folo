import type { tools as honoTools } from "@follow/shared/hono"
import type { Tool, UIDataTypes, UIMessage } from "ai"

export interface AIChatContextBlock {
  id: string
  type: "mainEntry" | "referEntry" | "referFeed" | "selectedText"
  value: string
}

export interface AIChatContextInfo {
  mainEntryId?: string
  referEntryIds?: string[]
  referFeedIds?: string[]
  selectedText?: string
}

export interface AIChatContextBlocks {
  blocks: AIChatContextBlock[]
}

// TypeScript utility to transform Tool<Input, Output> to { input: Input, output: Output }
type TransformTool<T> =
  T extends Tool<infer Input, infer Output>
    ? {
        input: Input
        output: Output
      }
    : never

// Transform the tools object to UITools format
type TransformTools<T> = {
  [K in keyof T]: TransformTool<T[K]>
}

// Apply the transformation to the hono tools
export type BizUITools = TransformTools<typeof honoTools>

export type BizUIMetadata = {
  startTime?: string
  finishTime?: string
  totalTokens?: number
  duration?: number
}

export type BizUIMessage = UIMessage<BizUIMetadata, UIDataTypes, BizUITools>
type ToolWithState<T> = T & {
  state: "input-streaming" | "input-available" | "output-available" | "output-error"
}
export type AIDisplayAnalyticsTool = ToolWithState<BizUITools["displayAnalytics"]>
export type AIDisplayFeedsTool = ToolWithState<BizUITools["displayFeeds"]>
export type AIDisplayEntriesTool = ToolWithState<BizUITools["displayEntries"]>
export type AIDisplaySubscriptionsTool = ToolWithState<BizUITools["displaySubscriptions"]>
