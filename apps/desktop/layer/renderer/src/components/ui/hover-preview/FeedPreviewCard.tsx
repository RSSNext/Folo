import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@follow/components/ui/hover-card/index.js"
import { useFeedById } from "@follow/store/feed/hooks"
import { feedIconSelector } from "@follow/store/feed/selectors"
import { cn } from "@follow/utils"
import { m } from "motion/react"
import * as React from "react"

import { FeedIcon } from "~/modules/feed/feed-icon"

interface FeedPreviewCardProps {
  feedId: string
  children: React.ReactNode
  className?: string

  onNavigate?: (feedId: string) => void
}

export const FeedPreviewCard: React.FC<FeedPreviewCardProps> = ({
  feedId,
  children,
  className,
  onNavigate,
}) => {
  const feed = useFeedById(feedId, feedIconSelector)

  if (!feed) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" side="top">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className={cn("overflow-hidden", className)}
        >
          {/* Header */}
          <a
            className="p-4"
            href={feed.url ?? "#"}
            onClick={(e) => {
              e.preventDefault()
              onNavigate?.(feedId)
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-start gap-3 pl-4">
              <FeedIcon target={feed} size={32} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="line-clamp-1 text-sm font-semibold text-text">{feed.title}</h3>
                </div>
              </div>
            </div>
          </a>
        </m.div>
      </HoverCardContent>
    </HoverCard>
  )
}
