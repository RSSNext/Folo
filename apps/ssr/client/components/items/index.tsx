import { GridList } from "@client/components/items/grid"
import { NormalListItem } from "@client/components/items/normal"
import { PictureList } from "@client/components/items/picture"
import type { Feed } from "@client/query/feed"
import { FeedViewType } from "@follow/constants"
import type { ParsedEntry } from "@follow-app/client-sdk"
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
  entries: ParsedEntry[]
  feed?: Feed
  view: FeedViewType
}) => {
  return useMemo(() => {
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
}

const NormalList: FC<{
  entries: ParsedEntry[]

  feed?: Feed
}> = ({ entries, feed }) => {
  return (
    <>
      {entries?.map((entry) => (
        <div className="relative cursor-default" key={entry.id}>
          <NormalListItem
            withDetails
            entryPreview={{
              entry,
              feed: feed?.feed,

              feedId: feed?.feed.id,
            }}
          />
        </div>
      ))}
    </>
  )
}
