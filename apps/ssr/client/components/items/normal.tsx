import { RelativeTime } from "@follow/components/ui/datetime/index.jsx"
import { MagneticHoverEffect } from "@follow/components/ui/effect/MagneticHoverEffect.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { cn } from "@follow/utils/utils"
import { memo } from "react"

import { FeedIcon } from "../ui/feed-icon"
import { LazyImage } from "../ui/image"
import type { UniversalItemProps } from "./types"

function NormalListItemImpl({
  entryPreview,

  withDetails,
}: UniversalItemProps & {
  withDetails?: boolean
}) {
  const entry = entryPreview

  const feed = entryPreview?.feeds

  if (!entry || !feed) return null
  const displayTime = entry.entries.publishedAt

  return (
    <MagneticHoverEffect className={"group relative mx-auto flex max-w-3xl gap-2 py-4 pl-3 pr-2"}>
      <FeedIcon feed={feed} fallback entry={entry.entries} />
      <div className={"-mt-0.5 flex-1 text-base leading-tight"}>
        <div className={cn("flex gap-1 text-xs font-bold", "text-text-secondary")}>
          <EllipsisHorizontalTextWithTooltip className="truncate">
            {feed?.title}
          </EllipsisHorizontalTextWithTooltip>
          <span>·</span>
          <span className="shrink-0">{!!displayTime && <RelativeTime date={displayTime} />}</span>
        </div>
        <div className={cn("text-text relative my-0.5 line-clamp-1 break-words font-medium")}>
          {entry.entries.title}
        </div>
        {withDetails && (
          <div className="flex gap-2">
            <div className={cn("grow text-sm", "text-text-secondary line-clamp-3")}>
              {entry.entries.description}
            </div>
          </div>
        )}
      </div>
      {entry.entries.media?.[0] && (
        <div className="relative size-24 shrink-0 overflow-hidden rounded">
          <LazyImage
            proxy={{
              width: 160,
              height: 160,
            }}
            className="overflow-hidden rounded-lg"
            src={entry.entries.media[0].url}
            height={entry.entries.media[0].height}
            width={entry.entries.media[0].width}
            blurhash={entry.entries.media[0].blurhash}
          />
        </div>
      )}
    </MagneticHoverEffect>
  )
}

export const NormalListItem = memo(NormalListItemImpl)
