import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { cn } from "@follow/utils/utils"

import { RelativeTime } from "~/components/ui/datetime"
import { Media } from "~/components/ui/media"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

import type { EntryItemStatelessProps } from "../types"

export function PictureItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="bg-theme-background text-text relative mx-auto max-w-md select-none rounded-md transition-colors">
      <div className="relative">
        <div className="p-1.5">
          <div className="relative flex gap-2 overflow-x-auto">
            <div
              className={cn(
                "relative flex w-full shrink-0 items-center overflow-hidden rounded-md",
                !entry.media?.[0]!.url && "aspect-square",
              )}
            >
              {entry.media?.[0] ? (
                <Media
                  thumbnail
                  src={entry.media[0].url}
                  type={entry.media[0].type}
                  previewImageUrl={entry.media[0].preview_image_url}
                  className="size-full overflow-hidden"
                  mediaContainerClassName={"w-auto h-auto rounded"}
                  loading="lazy"
                  proxy={{
                    width: 0,
                    height: 0,
                  }}
                  height={entry.media[0].height}
                  width={entry.media[0].width}
                  blurhash={entry.media[0].blurhash}
                />
              ) : (
                <Skeleton className="size-full overflow-hidden" />
              )}
            </div>
          </div>
          <div className="relative flex-1 px-2 pb-3 pt-1 text-sm">
            <div className="relative mb-1 mt-1.5 truncate font-medium leading-none">
              {entry.title}
            </div>
            <div className="mt-1 flex items-center gap-1 truncate text-[13px]">
              <FeedIcon feed={feed} fallback className="size-4" />
              <FeedTitle feed={feed} />
              <span className="text-material-opaque">·</span>
              {!!entry.publishedAt && <RelativeTime date={entry.publishedAt} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
