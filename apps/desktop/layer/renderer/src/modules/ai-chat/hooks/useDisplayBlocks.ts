import { useMemo } from "react"

import type { AIChatContextBlock, ValueContextBlock } from "~/modules/ai-chat/store/types"

type ValueBlockOf<Type extends ValueContextBlock["type"]> = Omit<ValueContextBlock, "type"> & {
  type: Type
}

export type DisplayBlockItem =
  | {
      kind: "combined"
      viewBlock?: ValueBlockOf<"mainView">
      feedBlock?: ValueBlockOf<"mainFeed">
      unreadOnlyBlock?: ValueBlockOf<"unreadOnly">
    }
  | { kind: "single"; block: AIChatContextBlock }

/**
 * Custom hook to process blocks and merge mainView + mainFeed when both exist
 * Returns an array of display items that can be either combined or single blocks
 */
export const useDisplayBlocks = (blocks: AIChatContextBlock[]): DisplayBlockItem[] => {
  return useMemo(() => {
    // Early return for empty blocks
    if (!blocks?.length) {
      return []
    }

    const mainViewBlock = blocks.find(
      (block): block is ValueBlockOf<"mainView"> => block.type === "mainView",
    )
    const mainFeedBlock = blocks.find(
      (block): block is ValueBlockOf<"mainFeed"> => block.type === "mainFeed",
    )
    const unreadOnlyBlock = blocks.find(
      (block): block is ValueBlockOf<"unreadOnly"> => block.type === "unreadOnly",
    )

    // Always filter out unreadOnly from single blocks since it should only appear in combined blocks
    const filteredBlocks = blocks.filter((block) => block.type !== "unreadOnly")

    if (mainViewBlock) {
      const items: DisplayBlockItem[] = []

      // Create combined block with optional feedBlock
      items.push({
        kind: "combined",
        viewBlock: mainViewBlock,
        ...(mainFeedBlock && { feedBlock: mainFeedBlock }),
        ...(unreadOnlyBlock && { unreadOnlyBlock }),
      })

      // Add other blocks (excluding mainView, mainFeed, and unreadOnly)
      const otherBlocks = filteredBlocks.filter(
        (block) => block.id !== mainViewBlock.id && block.id !== mainFeedBlock?.id,
      )
      otherBlocks.forEach((block) => {
        items.push({ kind: "single", block })
      })

      return items
    }

    // If no mainView, show all blocks except unreadOnly
    return filteredBlocks.map((block) => ({ kind: "single" as const, block }))
  }, [blocks])
}
