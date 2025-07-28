import { FeedViewType } from "@follow/constants"

import { ArticleLayout } from "./ArticleLayout"
import { PicturesLayout } from "./PicturesLayout"
import { SocialMediaLayout } from "./SocialMediaLayout"
import { VideosLayout } from "./VideosLayout"

const EntryContentLayoutFactory = {
  [FeedViewType.Articles]: ArticleLayout,
  [FeedViewType.SocialMedia]: SocialMediaLayout,
  [FeedViewType.Pictures]: PicturesLayout,
  [FeedViewType.Videos]: VideosLayout,
  [FeedViewType.Audios]: ArticleLayout, // Use article layout as fallback for audio
  [FeedViewType.Notifications]: ArticleLayout, // Use article layout as fallback for notifications
}

export const getEntryContentLayout = (viewType: FeedViewType) => {
  return EntryContentLayoutFactory[viewType] || ArticleLayout
}
