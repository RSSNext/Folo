import { RSSHubLogo } from "@follow/components/ui/platform-icon/icons.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { env } from "@follow/shared/env.desktop"
import type { FeedModel } from "@follow/store/feed/types"
import type { InboxModel } from "@follow/store/inbox/types"
import type { ListModel } from "@follow/store/list/types"
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
  feed: FeedModel | ListModel | InboxModel
  docs?: string
  className?: string
  simple?: boolean
}) {
  let feedText: string | undefined
  let isRSSHub = false

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
      isRSSHub = Boolean(feedText?.startsWith("rsshub://"))
      break
    }
  }

  return (
    <div className={cn("flex select-text flex-col gap-2 text-sm", className)}>
      <div className="flex items-center">
        <FeedIcon
          target={feed}
          fallbackUrl={docs}
          className="mask-squircle mask shrink-0 rounded-none"
          size={32}
        />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="mb-0.5 flex items-center gap-1.5">
            <FeedTitle feed={feed} className="text-[15px] font-semibold" />
            {isRSSHub && <RSSHubIndicator />}
          </div>
          <EllipsisHorizontalTextWithTooltip className="truncate text-xs font-normal text-text-secondary duration-200">
            {feedText}
          </EllipsisHorizontalTextWithTooltip>
        </div>
      </div>
      {!simple && "description" in feed && feed.description && (
        <EllipsisHorizontalTextWithTooltip className="truncate pl-10 text-body font-normal text-text/80">
          {feed.description}
        </EllipsisHorizontalTextWithTooltip>
      )}
    </div>
  )
}

const RSSHubIndicator = () => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="inline-flex shrink-0 items-center gap-1 rounded bg-orange/10 px-1.5 py-0.5 text-xs text-orange">
          <RSSHubLogo className="size-2.5" />
          <span>RSSHub</span>
        </div>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>This feed is powered by RSSHub.</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
