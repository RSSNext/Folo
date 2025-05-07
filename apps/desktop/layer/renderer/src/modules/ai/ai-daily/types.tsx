import type { FeedViewType } from "@follow/constants"

import type { DayOf } from "./constants"

export type DailyView = Extract<FeedViewType, FeedViewType.Articles | FeedViewType.SocialMedia>
export interface DailyItemProps {
  view: DailyView
  day: DayOf

  className?: string
}
