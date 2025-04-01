import { FeedViewType } from "@follow/constants"
import type { ParseKeys } from "i18next"
import type * as React from "react"
import colors from "tailwindcss/colors"

import { AnnouncementCuteFiIcon } from "../icons/announcement_cute_fi"
import { MicCuteFiIcon } from "../icons/mic_cute_fi"
import { PaperCuteFiIcon } from "../icons/paper_cute_fi"
import { PicCuteFiIcon } from "../icons/pic_cute_fi"
import { TwitterCuteFiIcon } from "../icons/twitter_cute_fi"
import { VideoCuteFiIcon } from "../icons/video_cute_fi"
import { accentColor } from "../theme/colors"

export interface ViewDefinition {
  name: Extract<ParseKeys<"common">, `feed_view_type.${string}`>
  icon: React.FC<{ color?: string; height?: number; width?: number }>
  activeColor: string
  translation: string
  view: FeedViewType
  wideMode?: boolean
  gridMode?: boolean
}
export const views: ViewDefinition[] = [
  {
    name: "feed_view_type.articles",
    icon: PaperCuteFiIcon,
    activeColor: accentColor,
    translation: "title,description",
    view: FeedViewType.Articles,
  },
  {
    name: "feed_view_type.social_media",
    icon: TwitterCuteFiIcon,
    activeColor: colors.sky[500],
    translation: "content",
    view: FeedViewType.SocialMedia,
  },
  {
    name: "feed_view_type.pictures",
    icon: PicCuteFiIcon,
    activeColor: colors.green[500],
    translation: "title",
    view: FeedViewType.Pictures,
  },
  {
    name: "feed_view_type.videos",
    icon: VideoCuteFiIcon,
    activeColor: colors.red[500],
    translation: "title",
    view: FeedViewType.Videos,
  },
  {
    name: "feed_view_type.audios",
    icon: MicCuteFiIcon,
    activeColor: colors.purple[500],
    translation: "title",
    view: FeedViewType.Audios,
  },
  {
    name: "feed_view_type.notifications",
    icon: AnnouncementCuteFiIcon,
    activeColor: colors.yellow[500],
    translation: "title",
    view: FeedViewType.Notifications,
  },
]
