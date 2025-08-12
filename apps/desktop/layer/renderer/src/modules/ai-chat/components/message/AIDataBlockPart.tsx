import { cn } from "@follow/utils/utils"
import * as React from "react"

import type { AIChatContextBlock } from "~/modules/ai-chat/store/types"

import { AIDataBlockItem } from "./AIDataBlockItem"

interface AIDataBlockPartProps {
  blocks: AIChatContextBlock[]
}

/**
 * Main component for rendering AI chat context blocks
 * Displays various types of context (entries, feeds, text, files) with animations
 */
export const AIDataBlockPart: React.FC<AIDataBlockPartProps> = React.memo(({ blocks }) => {
  // Early return for empty blocks
  if (!blocks?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-2 rounded-lg p-1 pl-2",
        "bg-material-ultra-thick",
        "border-border border",
      )}
    >
      {/* Context indicator */}
      <div className="text-text-tertiary flex items-center gap-1.5">
        <i className="i-mgc-link-cute-re size-3.5" />
        <span className="text-xs font-medium">Context:</span>
      </div>

      {/* Render individual block items */}
      {blocks.map((block, index) => (
        <AIDataBlockItem key={block.id} block={block} index={index} />
      ))}
    </div>
  )
})

AIDataBlockPart.displayName = "AIDataBlockPart"
