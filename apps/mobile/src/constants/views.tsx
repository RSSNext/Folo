import type { ViewDefinition as ViewDefinitionBase } from "@follow/constants"
import { FeedViewType, views as viewsBase } from "@follow/constants"
import colors from "tailwindcss/colors"

import { AnnouncementCuteFiIcon } from "../icons/announcement_cute_fi"
import { MicCuteFiIcon } from "../icons/mic_cute_fi"
import { PaperCuteFiIcon } from "../icons/paper_cute_fi"
import { PicCuteFiIcon } from "../icons/pic_cute_fi"
import { TwitterCuteFiIcon } from "../icons/twitter_cute_fi"
import { VideoCuteFiIcon } from "../icons/video_cute_fi"
import { accentColor } from "../theme/colors"

interface ViewDefinitionExtended {
  icon: React.FC<{ color?: string; height?: number; width?: number }>
  activeColor: string
}
const extendMap: Record<FeedViewType, ViewDefinitionExtended> = {
  [FeedViewType.Articles]: {
    icon: PaperCuteFiIcon,
    activeColor: accentColor,
  },
  [FeedViewType.SocialMedia]: {
    icon: TwitterCuteFiIcon,
    activeColor: colors.sky[500],
  },
  [FeedViewType.Pictures]: {
    icon: PicCuteFiIcon,
    activeColor: colors.green[500],
  },
  [FeedViewType.Videos]: {
    icon: VideoCuteFiIcon,
    activeColor: colors.red[500],
  },
  [FeedViewType.Audios]: {
    icon: MicCuteFiIcon,
    activeColor: colors.purple[500],
  },
  [FeedViewType.Notifications]: {
    icon: AnnouncementCuteFiIcon,
    activeColor: colors.yellow[500],
  },
}

export interface ViewDefinition extends Omit<ViewDefinitionBase, "icon">, ViewDefinitionExtended {}

export const views: ViewDefinition[] = viewsBase.map((view) => {
  const extendedView = extendMap[view.view]
  return {
    ...view,
    ...extendedView,
  }
})
