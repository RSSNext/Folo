import type { AIChatContextBlock, AIChatContextInfo } from "./types"

export const contextInfoToBlocks = (contextInfo: AIChatContextInfo): AIChatContextBlock[] => {
  const blocks: AIChatContextBlock[] = []

  // Main entry (single)
  if (contextInfo.mainEntryId) {
    blocks.push({
      id: `main-entry-${contextInfo.mainEntryId}`,
      type: "mainEntry",
      value: contextInfo.mainEntryId,
    })
  }

  // Reference entries (multiple)
  contextInfo.referEntryIds?.forEach((entryId) => {
    blocks.push({
      id: `refer-entry-${entryId}`,
      type: "referEntry",
      value: entryId,
    })
  })

  // Reference feeds (multiple)
  contextInfo.referFeedIds?.forEach((feedId) => {
    blocks.push({
      id: `refer-feed-${feedId}`,
      type: "referFeed",
      value: feedId,
    })
  })

  // Selected text (single, auto-detected)
  if (contextInfo.selectedText) {
    blocks.push({
      id: "selected-text",
      type: "selectedText",
      value: contextInfo.selectedText,
    })
  }

  return blocks
}

export const blocksToContextInfo = (blocks: AIChatContextBlock[]): AIChatContextInfo => {
  const contextInfo: AIChatContextInfo = {}

  blocks.forEach((block) => {
    switch (block.type) {
      case "mainEntry": {
        contextInfo.mainEntryId = block.value
        break
      }
      case "referEntry": {
        if (!contextInfo.referEntryIds) contextInfo.referEntryIds = []
        contextInfo.referEntryIds.push(block.value)
        break
      }
      case "referFeed": {
        if (!contextInfo.referFeedIds) contextInfo.referFeedIds = []
        contextInfo.referFeedIds.push(block.value)
        break
      }
      case "selectedText": {
        contextInfo.selectedText = block.value
        break
      }
    }
  })

  return contextInfo
}
