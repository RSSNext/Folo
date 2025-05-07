import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import type { FeedOrListRespModel } from "@follow/models/types"
import { env } from "@follow/shared/env.desktop"
import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

export function FollowSummary({
  feed,
  docs,
  className,
  simple,
}: {
  feed: FeedOrListRespModel
  docs?: string
  className?: string
  simple?: boolean
}) {
  let feedText: string | undefined

  switch (feed.type) {
    case "list": {
      feedText = UrlBuilder.shareList(feed.id)
      break
    }
    case "inbox": {
      feedText = `${feed.id}${env.VITE_INBOXES_EMAIL}`
      break
    }
    default: {
      feedText = feed.url || docs
      break
    }
  }

  const isValidUrl = useMemo(() => {
    if (!feedText) return false
    return URL.canParse(feedText)
  }, [feedText])
  const FeedDescription = (
    <EllipsisHorizontalTextWithTooltip className="text-text-secondary truncate text-xs font-normal duration-200">
      {feedText}
    </EllipsisHorizontalTextWithTooltip>
  )
  return (
    <div className={cn("flex select-text flex-col gap-2 text-sm", className)}>
      <div className="flex items-center">
        <FeedIcon
          feed={feed}
          fallbackUrl={docs}
          className="mask-squircle mask shrink-0 rounded-none"
          size={32}
        />
        <div className="min-w-0 leading-tight">
          <FeedTitle feed={feed} className="mb-0.5 text-[15px] font-semibold" />
          {isValidUrl ? (
            <a
              href={feedText}
              target="_blank"
              className="*:hover:text-accent"
              rel="noopener noreferrer"
            >
              {FeedDescription}
            </a>
          ) : (
            FeedDescription
          )}
        </div>
      </div>
      {!simple && (
        <EllipsisHorizontalTextWithTooltip className="truncate text-sm font-normal text-zinc-500">
          {feed.description}
        </EllipsisHorizontalTextWithTooltip>
      )}
    </div>
  )
}
