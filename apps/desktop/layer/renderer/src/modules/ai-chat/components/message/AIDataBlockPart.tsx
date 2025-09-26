import { cn } from "@follow/utils/utils"
import * as React from "react"

import { useDisplayBlocks } from "~/modules/ai-chat/hooks/useDisplayBlocks"
import type { AIChatContextBlock } from "~/modules/ai-chat/store/types"

import { AIDataBlockItem, MainViewFeedDataBlockItem } from "./AIDataBlockItem"

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
    <div className="min-w-0 max-w-full text-left">
      <div
        className={cn(
          "inline-flex flex-wrap items-center gap-1.5 rounded-lg py-1 pl-2 pr-1",
          "bg-fill-secondary border-border/50 border",
        )}
      >
        {/* Compact context indicator */}
        <div className="text-text-secondary flex items-center gap-1">
          <i className="i-mgc-link-cute-re size-3" />
          <span className="text-xs">Context:</span>
        </div>

        {/* Render individual block items */}
        {displayBlocks.map((item, index) => {
          if (item.kind === "combined") {
            return (
              <MainViewFeedDataBlockItem
                key={item.viewBlock.id}
                viewBlock={item.viewBlock}
                feedBlock={item.feedBlock}
              />
            )
          }

          return <AIDataBlockItem key={item.block.id} block={item.block} index={index} />
        })}
      </div>
    </div>
  )
})

AIDataBlockPart.displayName = "AIDataBlockPart"
