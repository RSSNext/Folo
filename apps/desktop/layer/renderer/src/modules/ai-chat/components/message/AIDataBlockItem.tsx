import { cn } from "@follow/utils/utils"
import * as React from "react"

import type { AIChatContextBlock } from "~/modules/ai-chat/store/types"

import {
  getBlockIcon,
  getBlockLabel,
  getBlockStyles,
  getFileDisplayContent,
  isImageAttachment,
} from "./ai-block-constants"
import { EntryTitle, FeedTitle } from "./BlockTitleComponents"
import { ImageThumbnail } from "./ImageThumbnail"

interface AIDataBlockItemProps {
  block: AIChatContextBlock
  index: number
}

/**
 * Gets the display content for a context block
 */
const getDisplayContent = (block: AIChatContextBlock): React.ReactNode => {
  switch (block.type) {
    case "mainEntry":
    case "referEntry": {
      return <EntryTitle entryId={block.value} fallback={block.value} />
    }
    case "referFeed": {
      return <FeedTitle feedId={block.value} fallback={block.value} />
    }
    case "selectedText": {
      return `"${block.value}"`
    }
    case "fileAttachment": {
      if (!block.attachment) {
        return "[File: Unknown]"
      }
      return getFileDisplayContent(block.attachment)
    }
    default: {
      return ""
    }
  }
}

/**
 * Renders the appropriate icon or image thumbnail for a block
 */
const BlockIcon: React.FC<{
  block: AIChatContextBlock
  styles: ReturnType<typeof getBlockStyles>
}> = React.memo(({ block, styles }) => {
  // Handle image thumbnails for file attachments
  if (block.type === "fileAttachment" && block.attachment && isImageAttachment(block)) {
    return (
      <div
        className={cn(
          "flex size-5 flex-shrink-0 items-center justify-center rounded-md",
          styles.icon,
        )}
      >
        <ImageThumbnail attachment={block.attachment} />
      </div>
    )
  }

  const iconClass = getBlockIcon(block)

  return (
    <div
      className={cn(
        "flex size-5 flex-shrink-0 items-center justify-center rounded-md",
        styles.icon,
      )}
    >
      <i className={cn("size-3", iconClass)} />
    </div>
  )
})

BlockIcon.displayName = "BlockIcon"

/**
 * Individual block item component with optimized rendering and animations
 */
export const AIDataBlockItem: React.FC<AIDataBlockItemProps> = React.memo(({ block }) => {
  const styles = React.useMemo(() => getBlockStyles(block.type), [block.type])
  const label = React.useMemo(() => getBlockLabel(block.type), [block.type])
  const displayContent = React.useMemo(() => getDisplayContent(block), [block])

  return (
    <div
      key={block.id}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
        "border bg-gradient-to-r backdrop-blur-sm",
        styles.container,
      )}
    >
      <BlockIcon block={block} styles={styles} />

      {/* Label and content */}
      <div className="flex min-w-0 items-center gap-1">
        <span className={cn("text-xs font-medium", styles.label)}>{label}</span>
        <span className="text-text-secondary text-xs">·</span>
        <span
          className="text-text max-w-32 truncate text-xs font-medium"
          title={typeof displayContent === "string" ? displayContent : undefined}
        >
          {displayContent}
        </span>
      </div>
    </div>
  )
})

AIDataBlockItem.displayName = "AIDataBlockItem"
