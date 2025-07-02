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
