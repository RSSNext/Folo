import { cn } from "@follow/utils/utils"
import * as React from "react"

import type { AIChatContextBlock } from "~/modules/ai-chat/store/types"

import { AIDataBlockItem } from "./AIDataBlockItem"

interface AIDataBlockPartProps {
  blocks: AIChatContextBlock[]
}

/**
 * Main component for rendering AI chat context blocks
 * Displays various types of context (entries, feeds, text, files) with compact styling
 */
export const AIDataBlockPart: React.FC<AIDataBlockPartProps> = React.memo(({ blocks }) => {
  // Early return for empty blocks
  if (!blocks?.length) {
    return null
  }

  return (
    <div className="min-w-0 max-w-full text-left">
      <div
        className={cn(
          "inline-flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1",
          "bg-fill-secondary border-border/50 border",
        )}
      >
        {/* Compact context indicator */}
        <div className="text-text-secondary flex items-center gap-1">
          <i className="i-mgc-link-cute-re size-3" />
          <span className="text-xs">Context:</span>
        </div>

        {/* Render individual block items */}
        {blocks.map((block, index) => (
          <AIDataBlockItem key={block.id} block={block} index={index} />
        ))}
      </div>
    </div>
  )
})

AIDataBlockPart.displayName = "AIDataBlockPart"
