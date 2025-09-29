import { FeedViewType } from "@follow/constants"
import type { FC } from "react"

import { ArticleLayout } from "./ArticleLayout"
import { MediaLayout } from "./MediaLayout"
import { SocialMediaLayout } from "./SocialMediaLayout"
import type { EntryLayoutProps } from "./types"

type EntryLayoutComponent = FC<EntryLayoutProps>

const EntryContentLayoutFactory: Record<FeedViewType, EntryLayoutComponent> = {
  [FeedViewType.All]: ArticleLayout, // Use article layout as fallback for all view
  [FeedViewType.Articles]: ArticleLayout,
  [FeedViewType.SocialMedia]: SocialMediaLayout,
  [FeedViewType.Pictures]: MediaLayout, // Use unified media layout for pictures
  [FeedViewType.Videos]: MediaLayout, // Use unified media layout for videos
  [FeedViewType.Audios]: ArticleLayout, // Use article layout as fallback for audio
  [FeedViewType.Notifications]: ArticleLayout, // Use article layout as fallback for notifications
}

export const getEntryContentLayout = (viewType: FeedViewType): EntryLayoutComponent => {
  return EntryContentLayoutFactory[viewType] || ArticleLayout
}
