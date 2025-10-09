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
 * Custom hook to process blocks and merge mainView, mainFeed, and unreadOnly when any of them exist
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

    // If any of the three special block types exist, create a combined block
    if (mainViewBlock || mainFeedBlock || unreadOnlyBlock) {
      const items: DisplayBlockItem[] = []

      // Create combined block with optional blocks
      items.push({
        kind: "combined",
        ...(mainViewBlock && { viewBlock: mainViewBlock }),
        ...(mainFeedBlock && { feedBlock: mainFeedBlock }),
        ...(unreadOnlyBlock && { unreadOnlyBlock }),
      })

      // Add other blocks (excluding mainView, mainFeed, and unreadOnly)
      const otherBlocks = blocks.filter(
        (block) =>
          block.type !== "mainView" && block.type !== "mainFeed" && block.type !== "unreadOnly",
      )
      otherBlocks.forEach((block) => {
        items.push({ kind: "single", block })
      })

      return items
    }

    // If none of the special blocks exist, show all blocks as single blocks
    return blocks.map((block) => ({ kind: "single" as const, block }))
  }, [blocks])
}
