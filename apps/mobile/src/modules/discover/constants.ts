import type { RSSHubCategories } from "@follow/constants"

export enum SearchType {
  Feed = "feed",
  List = "list",
  // User = "user",
}

export const SearchTabs = [
  { name: "words.feeds", value: SearchType.Feed },
  { name: "words.lists", value: SearchType.List },
  // { name: "User", value: SearchType.User },
] as const

export type Language = "all" | "eng" | "cmn" | "fra"
export type DiscoverCategories = (typeof RSSHubCategories)[number] | string
