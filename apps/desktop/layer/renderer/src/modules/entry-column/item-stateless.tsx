import { FeedViewType } from "@follow/constants"
import type { FC } from "react"
import { memo } from "react"

import { ArticleItemStateLess } from "./Items/article-item"
import { AudioItemStateLess } from "./Items/audio-item"
import { NotificationItemStateLess } from "./Items/notification-item"
import { PictureItemStateLess } from "./Items/picture-item-stateless"
import { SocialMediaItemStateLess } from "./Items/social-media-item"
import { VideoItemStateLess } from "./Items/video-item"
import type { EntryItemStatelessProps } from "./types"

const StatelessItemMap = {
  [FeedViewType.Articles]: ArticleItemStateLess,
  [FeedViewType.SocialMedia]: SocialMediaItemStateLess,
  [FeedViewType.Pictures]: PictureItemStateLess,
  [FeedViewType.Videos]: VideoItemStateLess,
  [FeedViewType.Audios]: AudioItemStateLess,
  [FeedViewType.Notifications]: NotificationItemStateLess,
}

const getStatelessItemComponentByView = (view: FeedViewType) => {
  return StatelessItemMap[view] || ArticleItemStateLess
}

export const EntryItemStateless: FC<EntryItemStatelessProps> = memo((props) => {
  const Item = getStatelessItemComponentByView(props.view as FeedViewType)

  return <Item {...props} />
})
