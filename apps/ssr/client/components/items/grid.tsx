import type { EntriesPreview } from "@client/query/entries"
import type { Feed } from "@client/query/feed"
import { TitleMarquee } from "@follow/components/ui/marquee/index.jsx"
import dayjs from "dayjs"
import type { FC } from "react"

import { FeedIcon } from "../ui/feed-icon"
import { LazyImage } from "../ui/image"

export const GridList: FC<{
  entries: EntriesPreview
  feed?: Feed
}> = ({ entries, feed }) => {
  return (
    <div className="grid grid-cols-1 gap-3 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:px-3">
      {entries.map((entry) => (
        <div
          className="hover:bg-material-medium overflow-hidden rounded-md p-1.5 duration-200"
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
  feed?: Feed
  entryId: string
  entryPreview: EntriesPreview[number]
}> = ({ feed, entryPreview }) => {
  return (
    <div className={"relative px-2 py-1 text-sm"}>
      <div className="flex items-center">
        <div className={"relative mb-1 mt-1.5 flex w-full items-center gap-1 truncate font-medium"}>
          <TitleMarquee className="min-w-0 grow">{entryPreview.title}</TitleMarquee>
        </div>
      </div>
      <div className="flex items-center gap-1 truncate text-[13px]">
        <FeedIcon
          fallback
          className="mr-0.5 flex"
          feed={feed?.feed || entryPreview.feeds!}
          entry={entryPreview}
          size={18}
        />
        <span className={"min-w-0 truncate"}>{feed?.feed.title || entryPreview.feeds?.title}</span>
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
