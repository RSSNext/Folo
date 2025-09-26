import { useMemo } from "react"

import type { AIChatContextBlock, ValueContextBlock } from "~/modules/ai-chat/store/types"

type ValueBlockOf<Type extends ValueContextBlock["type"]> = Omit<ValueContextBlock, "type"> & {
  type: Type
}

export type DisplayBlockItem =
  | {
      kind: "combined"
      viewBlock: ValueBlockOf<"mainView">
      feedBlock: ValueBlockOf<"mainFeed">
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

    if (mainViewBlock && mainFeedBlock) {
      const items: DisplayBlockItem[] = []

      items.push({ kind: "combined", viewBlock: mainViewBlock, feedBlock: mainFeedBlock })

      const otherBlocks = blocks.filter(
        (block) => block.id !== mainViewBlock.id && block.id !== mainFeedBlock.id,
      )
      otherBlocks.forEach((block) => {
        items.push({ kind: "single", block })
      })

      return items
    }

    return blocks.map((block) => ({ kind: "single" as const, block }))
  }, [blocks])
}
