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
}

export const FeedPreviewCard: React.FC<FeedPreviewCardProps> = ({
  feedId,
  children,
  className,
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
          <div className="bg-fill-tertiary border-border border-b p-4">
            <div className="flex items-start gap-3">
              <FeedIcon target={feed} size={40} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-text line-clamp-1 text-sm font-semibold">{feed.title}</h3>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </HoverCardContent>
    </HoverCard>
  )
}
