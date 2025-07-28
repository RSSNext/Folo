import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"

import { RelativeTime } from "~/components/ui/datetime"
import { Media } from "~/components/ui/media/Media"
import { ListItem } from "~/modules/entry-column/templates/list-item-template"
import { FeedTitle } from "~/modules/feed/feed-title"

import { readableContentMaxWidth } from "../styles"
import type { EntryItemStatelessProps, UniversalItemProps } from "../types"

export function AudioItem({ entryId, entryPreview, translation }: UniversalItemProps) {
  return <ListItem entryId={entryId} entryPreview={entryPreview} translation={translation} />
}

AudioItem.wrapperClassName = readableContentMaxWidth

export function AudioItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg select-none rounded-md">
      <div className="relative">
        <div className="group relative flex py-4 pl-3 pr-2">
          <div className="-mt-0.5 line-clamp-4 flex-1 text-sm leading-tight">
            <div className="text-text-secondary flex gap-1 text-[10px] font-bold">
              <FeedTitle feed={feed} />
              <span>·</span>
              <span>{!!entry.publishedAt && <RelativeTime date={entry.publishedAt} />}</span>
            </div>
            <div className="relative my-0.5 line-clamp-3 break-words font-medium">
              {entry.description}
            </div>
          </div>
          <div className="relative ml-2 size-20 shrink-0">
            {entry.media?.[0] ? (
              <Media
                thumbnail
                src={entry.media[0].url}
                type={entry.media[0].type}
                previewImageUrl={entry.media[0].preview_image_url}
                className="mr-2 size-20 shrink-0 overflow-hidden rounded-sm"
                mediaContainerClassName={"w-auto h-auto rounded"}
                loading="lazy"
                proxy={{
                  width: 160,
                  height: 160,
                }}
                height={entry.media[0].height}
                width={entry.media[0].width}
                blurhash={entry.media[0].blurhash}
              />
            ) : (
              <Skeleton className="mr-2 size-20 shrink-0 overflow-hidden rounded-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AudioItemSkeleton = (
  <div className="relative mx-auto w-full select-none rounded-md">
    <div className="relative">
      <div className="group relative flex py-4 pl-3 pr-2">
        <div className="-mt-0.5 line-clamp-4 flex-1 text-sm leading-tight">
          <div className="text-material-opaque flex gap-1 text-[10px] font-bold">
            <Skeleton className="h-3 w-20" />
            <span>·</span>
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="relative my-0.5 break-words font-medium">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>
        <div className="relative ml-2 size-20 shrink-0">
          <Skeleton className="mr-2 size-20 shrink-0 overflow-hidden rounded-sm" />
        </div>
      </div>
    </div>
  </div>
)
