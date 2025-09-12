import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import type { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { clsx, cn } from "@follow/utils/utils"
import { memo, useCallback } from "react"

import { RelativeTime } from "~/components/ui/datetime"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { feedColumnStyles } from "~/modules/subscription-column/styles"

interface EntrySubscriptionItemProps {
  entryId: string
  view: FeedViewType
  className?: string
  isPreview?: boolean
}

const EntrySubscriptionItemImpl = ({ entryId, view, className }: EntrySubscriptionItemProps) => {
  const navigate = useNavigateEntry()

  // Use current route view for navigation to stay in current view
  const currentRouteView = useRouteParamsSelector((s) => s.view)
  const navigationView = currentRouteView ?? view

  const entry = useEntry(entryId, (entry) => {
    if (!entry) return null
    return {
      id: entry.id,
      title: entry.title,
      publishedAt: entry.publishedAt,
      feedId: entry.feedId,
      read: entry.read,
    }
  })

  const feed = useFeedById(entry?.feedId, (feed) => {
    if (!feed) return null
    return {
      id: feed.id,
      type: feed.type || "feed",
      title: feed.title,
      image: feed.image,
      siteUrl: feed.siteUrl,
      url: feed.url,
    }
  })

  const isActive = useRouteParamsSelector((routerParams) => routerParams.entryId === entryId)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      if (navigationView === undefined || !entry) return

      navigate({
        feedId: entry.feedId,
        entryId: entry.id,
        view: navigationView,
      })
    },
    [entry, navigate, navigationView],
  )

  if (!entry || !feed) return null

  return (
    <div
      data-entry-id={entryId}
      data-active={isActive}
      className={cn(
        feedColumnStyles.item,
        "mx-1 w-[calc(100%_-0.5rem)] py-1 pl-2.5",
        !entry.read && "font-medium",
        className,
      )}
      onClick={handleClick}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <FeedIcon fallback feed={feed} size={14} className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <EllipsisHorizontalTextWithTooltip
            className={clsx("text-text truncate text-sm leading-tight", entry.read && "opacity-90")}
          >
            {entry.title}
          </EllipsisHorizontalTextWithTooltip>

          <div className="text-text-secondary flex items-center gap-1 text-xs opacity-80">
            <EllipsisHorizontalTextWithTooltip className="max-w-24 truncate">
              {feed.title}
            </EllipsisHorizontalTextWithTooltip>
            {entry.publishedAt && (
              <>
                <span>·</span>
                <RelativeTime date={entry.publishedAt} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const EntrySubscriptionItem = memo(EntrySubscriptionItemImpl)
