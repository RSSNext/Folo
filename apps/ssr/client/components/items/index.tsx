import { GridList } from "@client/components/items/grid"
import { NormalListItem } from "@client/components/items/normal"
import { PictureList } from "@client/components/items/picture"
import type { EntriesPreview } from "@client/query/entries"
import type { Feed } from "@client/query/feed"
import { FeedViewType } from "@follow/constants"
import type { FC } from "react"
import { useMemo } from "react"

const viewsRenderType = {
  Normal: [
    FeedViewType.Articles,
    FeedViewType.Audios,
    FeedViewType.Notifications,
    FeedViewType.SocialMedia,
  ],
  Picture: [FeedViewType.Pictures],
  Grid: [FeedViewType.Videos],
}

export const Item = ({
  entries,
  feed,
  view,
}: {
  entries: EntriesPreview
  feed?: Feed
  view: FeedViewType
}) => {
  const renderContent = useMemo(() => {
    switch (true) {
      case viewsRenderType.Normal.includes(view): {
        return <NormalList entries={entries} feed={feed} />
      }
      case viewsRenderType.Picture.includes(view): {
        return <PictureList entries={entries} feed={feed} />
      }
      case viewsRenderType.Grid.includes(view): {
        return <GridList entries={entries} feed={feed} />
      }
    }
  }, [entries, feed, view])

  return <div>{renderContent}</div>
}

const NormalList: FC<{
  entries: EntriesPreview

  feed?: Feed
}> = ({ entries, feed }) => {
  return (
    <>
      {entries?.map((entry) => (
        <a className="relative" href={entry.url || void 0} target="_blank" key={entry.id}>
          <div className="rounded-xl pl-3 duration-300">
            <NormalListItem
              withDetails
              entryId={entry.id}
              entryPreview={{
                entries: entry,
                feeds: feed?.feed || entry.feeds!,
                read: true,
                feedId: feed?.feed.id || entry.feeds?.id!,
              }}
            />
          </div>
        </a>
      ))}
    </>
  )
}
