import { RelativeTime } from "@follow/components/ui/datetime/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { cn } from "@follow/utils/utils"
import type { FeedSchema, ParsedEntry } from "@follow-app/client-sdk"
import { memo } from "react"
import * as React from "react"

import { FeedIcon } from "../ui/feed-icon"
import { LazyImage } from "../ui/image"

function NormalListItemImpl({
  entryPreview,

  withDetails,
}: {
  entryPreview: {
    entry: ParsedEntry
    feed: Nullable<FeedSchema>
    feedId: Nullable<string>
  }
  withDetails?: boolean
}) {
  const entry = entryPreview

  const feed = entryPreview?.feed

  if (!entry || !feed) return null
  const displayTime = entry.entry.publishedAt

  return (
    <div
      className={
        "group relative mx-auto flex max-w-3xl gap-2 py-4 pl-3 pr-2 before:pointer-events-none before:absolute before:-inset-x-2 before:inset-y-0 before:z-[-1] before:scale-0 before:rounded-xl before:opacity-0 before:transition-all before:duration-200 hover:before:scale-100 hover:before:bg-material-ultra-thick hover:before:opacity-100"
      }
    >
      <FeedIcon target={feed} fallback entry={entry.entry} />
      <div className={"-mt-0.5 flex-1 text-base leading-tight"}>
        <div className={cn("flex gap-1 text-xs font-bold", "text-text-secondary")}>
          <EllipsisHorizontalTextWithTooltip className="truncate">
            {feed?.title}
          </EllipsisHorizontalTextWithTooltip>
          <span>·</span>
          <span className="shrink-0">{!!displayTime && <RelativeTime date={displayTime} />}</span>
        </div>
        <div className={cn("relative my-0.5 line-clamp-1 break-words font-medium text-text")}>
          {entry.entry.title}
        </div>
        {withDetails && (
          <div className="flex gap-2">
            <div className={cn("grow text-sm", "line-clamp-3 text-text-secondary")}>
              {entry.entry.description}
            </div>
          </div>
        )}
      </div>
      {entry.entry.media?.[0] && (
        <div className="relative size-24 shrink-0 overflow-hidden rounded">
          <LazyImage
            proxy={{
              width: 160,
              height: 160,
            }}
            className="overflow-hidden rounded-lg"
            src={entry.entry.media[0].url}
            height={entry.entry.media[0].height}
            width={entry.entry.media[0].width}
            blurhash={entry.entry.media[0].blurhash}
          />
        </div>
      )}
    </div>
  )
}

export const NormalListItem = memo(NormalListItemImpl)
