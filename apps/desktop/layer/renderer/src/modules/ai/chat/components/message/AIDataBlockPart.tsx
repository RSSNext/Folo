import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import * as React from "react"

import type { AIChatContextBlock } from "~/modules/ai/chat/__internal__/types"

interface AIDataBlockPartProps {
  blocks: AIChatContextBlock[]
}

// Helper components for displaying titles
const EntryTitle: React.FC<{ entryId?: string; fallback: string }> = ({ entryId, fallback }) => {
  const entryTitle = useEntry(entryId!, (e) => e?.title)

  if (!entryId || !entryTitle) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{entryTitle}</span>
}

const FeedTitle: React.FC<{ feedId?: string; fallback: string }> = ({ feedId, fallback }) => {
  const feed = useFeedById(feedId, (feed) => ({ title: feed?.title }))
  if (!feedId || !feed) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{feed.title}</span>
}

// Data Block Component
export const AIDataBlockPart: React.FC<AIDataBlockPartProps> = React.memo(({ blocks }) => {
  const getBlockIcon = (type: AIChatContextBlock["type"]) => {
    switch (type) {
      case "mainEntry": {
        return "i-mgc-star-cute-fi"
      }
      case "referEntry": {
        return "i-mgc-paper-cute-fi"
      }
      case "referFeed": {
        return "i-mgc-rss-cute-fi"
      }
      case "selectedText": {
        return "i-mgc-quill-pen-cute-re"
      }
      default: {
        return "i-mgc-paper-cute-fi"
      }
    }
  }

  const getBlockLabel = (type: AIChatContextBlock["type"]) => {
    switch (type) {
      case "mainEntry": {
        return "Current"
      }
      case "referEntry": {
        return "Ref"
      }
      case "referFeed": {
        return "Feed"
      }
      case "selectedText": {
        return "Text"
      }
      default: {
        return ""
      }
    }
  }

  const getBlockStyles = (type: AIChatContextBlock["type"]) => {
    switch (type) {
      case "mainEntry": {
        return {
          container: "from-orange/5 to-orange/10 border-orange/20 hover:border-orange/30",
          icon: "bg-orange/10 text-orange",
          label: "text-orange",
        }
      }
      case "referEntry": {
        return {
          container: "from-blue/5 to-blue/10 border-blue/20 hover:border-blue/30",
          icon: "bg-blue/10 text-blue",
          label: "text-blue",
        }
      }
      case "referFeed": {
        return {
          container: "from-green/5 to-green/10 border-green/20 hover:border-green/30",
          icon: "bg-green/10 text-green",
          label: "text-green",
        }
      }
      case "selectedText": {
        return {
          container: "from-purple/5 to-purple/10 border-purple/20 hover:border-purple/30",
          icon: "bg-purple/10 text-purple",
          label: "text-purple",
        }
      }
      default: {
        return {
          container: "from-gray/5 to-gray/10 border-gray/20 hover:border-gray/30",
          icon: "bg-gray/10 text-gray",
          label: "text-gray",
        }
      }
    }
  }

  const getDisplayContent = (block: AIChatContextBlock) => {
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
      default: {
        return block.value
      }
    }
  }

  if (!blocks || blocks.length === 0) {
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

      {/* Blocks */}
      {blocks.map((block, index) => {
        const styles = getBlockStyles(block.type)

        return (
          <m.div
            key={block.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
              "border bg-gradient-to-r backdrop-blur-sm transition-all duration-200",
              "hover:scale-105 hover:shadow-md",
              styles.container,
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex size-5 flex-shrink-0 items-center justify-center rounded-md",
                styles.icon,
              )}
            >
              <i className={cn("size-3", getBlockIcon(block.type))} />
            </div>

            {/* Label and content */}
            <div className="flex min-w-0 items-center gap-1">
              <span className={cn("text-xs font-medium", styles.label)}>
                {getBlockLabel(block.type)}
              </span>
              <span className="text-text-secondary text-xs">·</span>
              <span className="text-text max-w-32 truncate text-xs font-medium">
                {getDisplayContent(block)}
              </span>
            </div>
          </m.div>
        )
      })}
    </div>
  )
})

AIDataBlockPart.displayName = "AIDataBlockPart"
