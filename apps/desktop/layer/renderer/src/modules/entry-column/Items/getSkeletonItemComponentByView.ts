import { FeedViewType } from "@follow/constants"

import { ArticleItemSkeleton } from "./article-item"
import { AudioItemSkeleton } from "./audio-item"
import { NotificationItemSkeleton } from "./notification-item"
import { PictureItemSkeleton } from "./picture-item-skeleton"
import { SocialMediaItemSkeleton } from "./social-media-item"
import { VideoItemSkeleton } from "./video-item"

const SkeletonItemMap = {
  [FeedViewType.Articles]: ArticleItemSkeleton,
  [FeedViewType.SocialMedia]: SocialMediaItemSkeleton,
  [FeedViewType.Pictures]: PictureItemSkeleton,
  [FeedViewType.Videos]: VideoItemSkeleton,
  [FeedViewType.Audios]: AudioItemSkeleton,
  [FeedViewType.Notifications]: NotificationItemSkeleton,
}

export const getSkeletonItemComponentByView = (view: FeedViewType) => {
  return SkeletonItemMap[view]
}
