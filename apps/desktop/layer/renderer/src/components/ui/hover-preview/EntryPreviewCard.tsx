import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@follow/components/ui/hover-card/index.js"
import { useEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { feedIconSelector } from "@follow/store/feed/selectors"
import { cn } from "@follow/utils"
import { m } from "motion/react"
import * as React from "react"

import { RelativeTime } from "~/components/ui/datetime"
import { FeedIcon } from "~/modules/feed/feed-icon"

interface EntryPreviewCardProps {
  entryId: string
  children: React.ReactNode
  className?: string
  onNavigate?: (entryId: string) => void
}

export const EntryPreviewCard: React.FC<EntryPreviewCardProps> = ({
  entryId,
  children,
  className,
  onNavigate,
}) => {
  // Prefetch entry details on hover
  usePrefetchEntryDetail(entryId)

  const entry = useEntry(entryId, (state) => {
    if (!state) return null
    return {
      title: state.title,
      description: state.description,
      author: state.author,
      publishedAt: state.publishedAt,
      feedId: state.feedId,
      url: state.url,
    }
  })

  const feed = useFeedById(entry?.feedId, feedIconSelector)

  if (!entry || !feed) {
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
          <div className="border-b border-border bg-fill-tertiary p-3">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={feed.siteUrl || feed.url}
              className="flex items-center gap-2"
            >
              <FeedIcon target={feed} size={16} />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-medium text-text">{feed.title}</div>
                <span className="line-clamp-1 text-xs text-text-tertiary">{feed.url}</span>
              </div>
            </a>
          </div>

          {/* Content */}
          <div className="p-3">
            <div className="space-y-2">
              <a
                href={entry.url ?? "#"}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate?.(entryId)
                }}
                className="contents"
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3 className="line-clamp-2 text-sm font-semibold text-text">{entry.title}</h3>

                {entry.description && (
                  <p className="line-clamp-3 text-xs text-text-secondary">{entry.description}</p>
                )}
              </a>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-text-tertiary">
                  {entry.author && <span>by {entry.author}</span>}
                </div>
                <div className="shrink-0 self-start text-xs text-text-tertiary">
                  <RelativeTime date={entry.publishedAt} />
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </HoverCardContent>
    </HoverCard>
  )
}
