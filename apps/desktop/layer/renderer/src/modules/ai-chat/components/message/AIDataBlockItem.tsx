import { getView } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { t } from "i18next"
import * as React from "react"

import type { AIChatContextBlock, ValueContextBlock } from "~/modules/ai-chat/store/types"

import { getBlockStyles } from "./ai-block-constants"
import { FeedTitle } from "./BlockTitleComponents"
import { ImageThumbnail } from "./ImageThumbnail"
import { useContextBlockPresentation } from "./useContextBlockPresentation"

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

/**
 * Renders the appropriate icon or image thumbnail for a block
 */
const BlockIcon: React.FC<{
  block: AIChatContextBlock
  styles: ReturnType<typeof getBlockStyles>
  presentation: ReturnType<typeof useContextBlockPresentation>
}> = React.memo(({ block, styles, presentation }) => {
  if (
    block.type === "fileAttachment" &&
    presentation.attachment &&
    presentation.isImageAttachment
  ) {
    return (
      <div
        className={cn("flex size-4 flex-shrink-0 items-center justify-center rounded", styles.icon)}
      >
        <ImageThumbnail attachment={presentation.attachment} />
      </div>
    )
  }

  const iconClass = presentation.icon

  if (!iconClass) {
    return null
  }

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
  presentation: ReturnType<typeof useContextBlockPresentation>
}> = React.memo(({ styles, block, label, displayContent, title, presentation }) => {
  return (
    <div
      key={block.id}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
        "border bg-gradient-to-r backdrop-blur-sm",
        styles.container,
      )}
    >
      <BlockIcon block={block} styles={styles} presentation={presentation} />

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
  const presentation = useContextBlockPresentation(block)

  return (
    <BlockContainer
      styles={styles}
      block={block}
      label={presentation.label}
      displayContent={presentation.displayContent}
      title={presentation.title}
      presentation={presentation}
    />
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

    const presentation = useContextBlockPresentation(block)

    return (
      <BlockContainer
        styles={styles}
        block={block}
        label={presentation.label}
        displayContent={displayContent}
        title={title}
        presentation={presentation}
      />
    )
  },
)

CombinedDataBlockItem.displayName = "CombinedDataBlockItem"
