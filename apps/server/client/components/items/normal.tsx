import { RelativeTime } from "@follow/components/ui/datetime/index.jsx"
import { FeedIcon } from "@follow/components/ui/feed-icon/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { cn } from "@follow/utils/utils"
import { memo } from "react"

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
    <div className={"group relative flex gap-2 rounded-lg py-4 pl-3 pr-2 duration-200"}>
      <FeedIcon feed={feed} fallback entry={entry.entries} />
      <div className={"-mt-0.5 flex-1 text-sm leading-tight"}>
        <div
          className={cn(
            "flex gap-1 text-[10px] font-bold",
            "text-zinc-400 dark:text-neutral-500",
            entry.collections && "text-zinc-600 dark:text-zinc-500",
          )}
        >
          <EllipsisHorizontalTextWithTooltip className="truncate">
            {feed?.title}
          </EllipsisHorizontalTextWithTooltip>
          <span>·</span>
          <span className="shrink-0">{!!displayTime && <RelativeTime date={displayTime} />}</span>
        </div>
        <div
          className={cn(
            "relative my-0.5 line-clamp-2 break-words",
            !!entry.collections && "pr-5",
            entry.entries.title ? withDetails && "font-medium" : "text-[13px]",
          )}
        >
          {entry.entries.title}

          {/* {!!entry.collections && <StarIcon className="absolute right-0 top-0" />} */}
        </div>
        {withDetails && (
          <div className="flex gap-2">
            <div
              className={cn("grow text-[13px]", "line-clamp-5 text-zinc-400 dark:text-neutral-500")}
            >
              {entry.entries.description}
            </div>

            {entry.entries.media?.[0] && (
              <div className="relative size-24 shrink-0 overflow-hidden rounded">
                <LazyImage
                  proxy={{
                    width: 160,
                    height: 160,
                  }}
                  className="overflow-hidden rounded"
                  src={entry.entries.media[0].url}
                  height={entry.entries.media[0].height}
                  width={entry.entries.media[0].width}
                  blurhash={entry.entries.media[0].blurhash}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const NormalListItem = memo(NormalListItemImpl)
