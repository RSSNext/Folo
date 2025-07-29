import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import type { FeedOrListRespModel } from "@follow/models/types"
import { env } from "@follow/shared/env.desktop"
import { cn } from "@follow/utils/utils"

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
          <EllipsisHorizontalTextWithTooltip className="text-text-secondary truncate text-xs font-normal duration-200">
            {feedText}
          </EllipsisHorizontalTextWithTooltip>
        </div>
      </div>
      {!simple && "description" in feed && feed.description && (
        <EllipsisHorizontalTextWithTooltip className="text-text/80 text-body truncate pl-10 font-normal">
          {feed.description}
        </EllipsisHorizontalTextWithTooltip>
      )}
    </div>
  )
}
