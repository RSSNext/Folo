import * as React from "react"

import { CombinedContextBlock, ContextBlock } from "~/modules/ai-chat/components/context-bar/blocks"
import { useDisplayBlocks } from "~/modules/ai-chat/hooks/useDisplayBlocks"
import type { AIChatContextBlock } from "~/modules/ai-chat/store/types"

interface AIDataBlockPartProps {
  blocks: AIChatContextBlock[]
}

/**
 * Main component for rendering AI chat context blocks
 * Displays various types of context (entries, feeds, text, files) with compact styling
 */
export const AIDataBlockPart: React.FC<AIDataBlockPartProps> = React.memo(({ blocks }) => {
  const displayBlocks = useDisplayBlocks(blocks)

  // Early return for empty blocks
  if (displayBlocks.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {displayBlocks.map((item) => {
        if (item.kind === "combined") {
          return (
            <CombinedContextBlock
              key={`combined-${item.viewBlock?.id}-${item.feedBlock?.id}-${item.unreadOnlyBlock?.id}`}
              viewBlock={item.viewBlock}
              feedBlock={item.feedBlock}
              unreadOnlyBlock={item.unreadOnlyBlock}
              readOnly
            />
          )
        }

        return <ContextBlock key={item.block.id} block={item.block} readOnly />
      })}
    </div>
  )
})

AIDataBlockPart.displayName = "AIDataBlockPart"
