import type { FeedEntryItem } from "@client/components/items/types"
import { TitleMarquee } from "@follow/components/ui/marquee/index.jsx"
import type { FeedSchema, ParsedEntry } from "@follow-app/client-sdk"
import dayjs from "dayjs"
import type { FC } from "react"
import * as React from "react"

import { FeedIcon } from "../ui/feed-icon"
import { LazyImage } from "../ui/image"

export const GridList: FC<{
  items: FeedEntryItem[]
}> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 gap-3 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:px-3">
      {items.map(({ entry, feed }) => (
        <div
          className="overflow-hidden rounded-md p-1.5 duration-200 hover:bg-material-medium"
          key={entry.id}
        >
          <div className="relative -mx-1.5 -mt-1.5">
            <LazyImage
              src={entry.media?.[0]!.url}
              className="aspect-video h-auto w-full shrink-0 rounded-md object-cover"
            />
          </div>
          <GridItemFooter feed={feed} entryId={entry.id} entryPreview={entry} />
        </div>
      ))}
    </div>
  )
}

const GridItemFooter: FC<{
  feed: Nullable<FeedSchema>
  entryId: string
  entryPreview: ParsedEntry
}> = ({ feed, entryPreview }) => {
  return (
    <div className={"relative px-2 py-1 text-sm"}>
      <div className="flex items-center">
        <div className={"relative mb-1 mt-1.5 flex w-full items-center gap-1 truncate font-medium"}>
          <TitleMarquee className="min-w-0 grow">{entryPreview.title}</TitleMarquee>
        </div>
      </div>
      <div className="flex items-center gap-1 truncate text-[13px]">
        <FeedIcon fallback className="mr-0.5 flex" target={feed} entry={entryPreview} size={18} />
        <span className={"min-w-0 truncate"}>{feed?.title}</span>
        <span className={"text-zinc-500"}>·</span>
        <span className={"text-zinc-500"}>
          {dayjs
            .duration(dayjs(entryPreview.publishedAt).diff(dayjs(), "minute"), "minute")
            .humanize()}
        </span>
      </div>
    </div>
  )
}
