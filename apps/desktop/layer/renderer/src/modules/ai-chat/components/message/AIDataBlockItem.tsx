import { getView } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { t } from "i18next"
import * as React from "react"

import type { AIChatContextBlock, ValueContextBlock } from "~/modules/ai-chat/store/types"

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

type ValueBlockOf<Type extends ValueContextBlock["type"]> = Omit<ValueContextBlock, "type"> & {
  type: Type
}

interface CombinedDataBlockItemProps {
  viewBlock?: ValueBlockOf<"mainView">
  feedBlock?: ValueBlockOf<"mainFeed">
  unreadOnlyBlock?: ValueBlockOf<"unreadOnly">
}

/**
 * Gets the display content for a context block
 */
const getDisplayContent = (block: AIChatContextBlock): React.ReactNode => {
  switch (block.type) {
    case "mainView": {
      const viewName = getView(Number(block.value))?.name
      return viewName ? t(viewName, { ns: "common" }) : block.value
    }
    case "mainEntry":
    case "referEntry": {
      return <EntryTitle entryId={block.value} fallback={block.value} />
    }
    case "mainFeed": {
      return <FeedTitle feedId={block.value} fallback={block.value} />
    }
    case "selectedText": {
      return `"${block.value}"`
    }
    case "unreadOnly": {
      return "Unread Only"
    }
    case "fileAttachment": {
      if (!block.attachment) {
        return "[File: Unknown]"
      }
      if (block.attachment.name && !block.attachment.uploadStatus) {
        return block.attachment.name
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
        className={cn("flex size-4 flex-shrink-0 items-center justify-center rounded", styles.icon)}
      >
        <ImageThumbnail attachment={block.attachment} />
      </div>
    )
  }

  const iconClass = getBlockIcon(block)

  return (
    <div
      className={cn("flex size-4 flex-shrink-0 items-center justify-center rounded", styles.icon)}
    >
      <i className={cn("size-2.5", iconClass)} />
    </div>
  )
})

BlockIcon.displayName = "BlockIcon"

/**
 * Shared block container component to ensure consistency
 */
const BlockContainer: React.FC<{
  styles: ReturnType<typeof getBlockStyles>
  block: AIChatContextBlock
  label?: string
  displayContent: React.ReactNode
  title?: string
}> = React.memo(({ styles, block, label, displayContent, title }) => {
  return (
    <div
      key={block.id}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
        "border bg-gradient-to-r backdrop-blur-sm",
        styles.container,
      )}
    >
      <BlockIcon block={block} styles={styles} />

      {/* Label and content */}
      <div className="flex min-w-0 items-center gap-1">
        {label && (
          <>
            <span className={cn("text-xs font-medium", styles.label)}>{label}</span>
            <span className="text-text-secondary text-xs">·</span>
          </>
        )}
        <span
          className="text-text max-w-24 truncate text-xs font-medium"
          title={title || (typeof displayContent === "string" ? displayContent : undefined)}
        >
          {displayContent}
        </span>
      </div>
    </div>
  )
})

BlockContainer.displayName = "BlockContainer"

/**
 * Individual block item component with optimized rendering and animations
 */
export const AIDataBlockItem: React.FC<AIDataBlockItemProps> = React.memo(({ block }) => {
  const styles = React.useMemo(() => getBlockStyles(block.type), [block.type])
  const label = React.useMemo(() => getBlockLabel(block.type), [block.type])
  const displayContent = React.useMemo(() => getDisplayContent(block), [block])

  return (
    <BlockContainer styles={styles} block={block} label={label} displayContent={displayContent} />
  )
})

AIDataBlockItem.displayName = "AIDataBlockItem"

/**
 * Combined block item component for main view with optional feed and unread filter
 * Displays view icon with appropriate content based on available blocks
 */
export const CombinedDataBlockItem: React.FC<CombinedDataBlockItemProps> = React.memo(
  ({ viewBlock, feedBlock, unreadOnlyBlock }) => {
    const { styles, displayContent, title, block } = React.useMemo(() => {
      const unreadOnlyText = unreadOnlyBlock ? " (Unread Only)" : ""
      const unreadIcon = unreadOnlyBlock && (
        <i className="i-mgc-round-cute-fi size-3" title="Unread Only" />
      )

      // Helper function to create content with optional unread indicator
      const createContent = (mainContent: React.ReactNode) => (
        <span className="flex items-center gap-1">
          {mainContent}
          {unreadIcon}
        </span>
      )

      // Handle case when viewBlock is null/undefined
      if (!viewBlock) {
        // Prioritize feedBlock if available
        if (feedBlock) {
          return {
            styles: getBlockStyles("mainFeed"),
            displayContent: createContent(
              <FeedTitle feedId={feedBlock.value} fallback={feedBlock.value} />,
            ),
            title: `${feedBlock.value}${unreadOnlyText}`,
            block: feedBlock,
          }
        }

        // Handle unreadOnly-only case
        if (unreadOnlyBlock) {
          return {
            styles: getBlockStyles("unreadOnly"),
            displayContent: createContent("Unread Only"),
            title: "Unread Only",
            block: unreadOnlyBlock,
          }
        }

        // Fallback case
        const fallbackBlock = { id: "fallback", type: "mainView" as const, value: "" }
        return {
          styles: getBlockStyles("mainView"),
          displayContent: createContent("No context"),
          title: "No context",
          block: fallbackBlock,
        }
      }

      // Handle case when viewBlock exists
      const view = getView(Number(viewBlock.value))
      const viewName = view?.name ? t(view.name, { ns: "common" }) : viewBlock.value

      // Determine primary content: feedBlock takes precedence over viewBlock
      const primaryContent = feedBlock ? (
        <FeedTitle feedId={feedBlock.value} fallback={feedBlock.value} />
      ) : (
        viewName
      )

      const titleText = feedBlock
        ? `${viewName} - ${feedBlock.value}${unreadOnlyText}`
        : `${viewName}${unreadOnlyText}`

      return {
        styles: getBlockStyles("mainView"),
        displayContent: createContent(primaryContent),
        title: titleText,
        block: viewBlock,
      }
    }, [viewBlock, feedBlock, unreadOnlyBlock])

    return (
      <BlockContainer styles={styles} block={block} displayContent={displayContent} title={title} />
    )
  },
)

CombinedDataBlockItem.displayName = "CombinedDataBlockItem"
