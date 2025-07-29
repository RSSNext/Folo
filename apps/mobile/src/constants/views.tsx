import type { ViewDefinition as ViewDefinitionBase } from "@follow/constants"
import { FeedViewType, views as viewsBase } from "@follow/constants"

import { AnnouncementCuteFiIcon } from "../icons/announcement_cute_fi"
import { MicCuteFiIcon } from "../icons/mic_cute_fi"
import { PaperCuteFiIcon } from "../icons/paper_cute_fi"
import { PicCuteFiIcon } from "../icons/pic_cute_fi"
import { TwitterCuteFiIcon } from "../icons/twitter_cute_fi"
import { VideoCuteFiIcon } from "../icons/video_cute_fi"

interface ViewDefinitionExtended {
  icon: React.FC<{ color?: string; height?: number; width?: number }>
}
const extendMap: Record<FeedViewType, ViewDefinitionExtended> = {
  [FeedViewType.Articles]: {
    icon: PaperCuteFiIcon,
  },
  [FeedViewType.SocialMedia]: {
    icon: TwitterCuteFiIcon,
  },
  [FeedViewType.Pictures]: {
    icon: PicCuteFiIcon,
  },
  [FeedViewType.Videos]: {
    icon: VideoCuteFiIcon,
  },
  [FeedViewType.Audios]: {
    icon: MicCuteFiIcon,
  },
  [FeedViewType.Notifications]: {
    icon: AnnouncementCuteFiIcon,
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
