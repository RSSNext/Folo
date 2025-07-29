import type { RSSHubCategories } from "@follow/constants"

export enum SearchType {
  Feed = "feed",
  List = "list",
  // User = "user",
}

export const SearchTabs = [
  { name: "Feed", value: SearchType.Feed },
  { name: "List", value: SearchType.List },
  // { name: "User", value: SearchType.User },
]

const _languageOptions = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "English",
    value: "en",
  },
  {
    label: "中文",
    value: "zh-CN",
  },
] as const

export type Language = (typeof _languageOptions)[number]["value"]
export type DiscoverCategories = (typeof RSSHubCategories)[number] | string
