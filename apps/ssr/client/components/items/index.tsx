import { GridList } from "@client/components/items/grid"
import { NormalListItem } from "@client/components/items/normal"
import { PictureList } from "@client/components/items/picture"
import type { EntryWithFeed, FeedEntryItem } from "@client/components/items/types"
import type { Feed } from "@client/query/feed"
import { FeedViewType } from "@follow/constants"
import type { FC } from "react"
import { useMemo } from "react"
import * as React from "react"

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
  entries: EntryWithFeed[]
  /**
   * Feed shared by every entry, e.g. on a feed page. Entries that carry their own feed use it
   * instead.
   */
  feed?: Feed
  view: FeedViewType
}) => {
  return useMemo(() => {
    const items: FeedEntryItem[] =
      entries?.map((entry) => ({
        entry,
        feed: entry.feeds ?? feed?.feed,
      })) ?? []

    switch (true) {
      case viewsRenderType.Normal.includes(view): {
        return <NormalList items={items} />
      }
      case viewsRenderType.Picture.includes(view): {
        return <PictureList items={items} />
      }
      case viewsRenderType.Grid.includes(view): {
        return <GridList items={items} />
      }
    }
  }, [entries, feed, view])
}

const NormalList: FC<{
  items: FeedEntryItem[]
}> = ({ items }) => {
  return (
    <>
      {items.map(({ entry, feed }) => (
        <div className="relative cursor-default" key={entry.id}>
          <NormalListItem
            withDetails
            entryPreview={{
              entry,
              feed,

              feedId: feed?.id,
            }}
          />
        </div>
      ))}
    </>
  )
}
