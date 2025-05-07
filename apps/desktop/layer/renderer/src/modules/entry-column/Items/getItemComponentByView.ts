import { FeedViewType } from "@follow/constants"

import { ArticleItem } from "./article-item"
import { AudioItem } from "./audio-item"
import { NotificationItem } from "./notification-item"
import { PictureItem } from "./picture-item"
import { SocialMediaItem } from "./social-media-item"
import { VideoItem } from "./video-item"

const ItemMap = {
  [FeedViewType.Articles]: ArticleItem,
  [FeedViewType.SocialMedia]: SocialMediaItem,
  [FeedViewType.Pictures]: PictureItem,
  [FeedViewType.Videos]: VideoItem,
  [FeedViewType.Audios]: AudioItem,
  [FeedViewType.Notifications]: NotificationItem,
}
export const getItemComponentByView = (view: FeedViewType) => {
  return ItemMap[view] || ArticleItem
}
