import { FeedViewType } from "@follow/constants"

import feeds from "./feeds.json"
import englishFeeds from "./feeds-english.json"

export type PresetFeedConfig = {
  title: string
  feedId: string
  url: string
  view: FeedViewType
}

export const englishPresetFeeds: PresetFeedConfig[] = englishFeeds.map((feed) => ({
  view: FeedViewType.Articles,
  ...feed,
}))

export const otherPresetFeeds: PresetFeedConfig[] = feeds
  // .filter((feed) => feed.language === "Chinese")
  .map((feed) => ({
    view: FeedViewType.Articles,
    ...feed,
  }))

export const getPresetFeeds = (isEnglishUser: boolean) =>
  isEnglishUser ? englishPresetFeeds : otherPresetFeeds
