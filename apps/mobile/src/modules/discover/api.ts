import { followClient } from "@/src/lib/api-client"

import type { DiscoverCategories, Language } from "./constants"

export const fetchRsshubPopular = (category: DiscoverCategories, lang: Language) => {
  return followClient.api.discover.rsshub({
    category: "popular",
    categories: category === "all" ? "popular" : category,
    lang: lang === "all" ? undefined : lang,
  })
}

export const fetchRsshubAnalysis = (lang: Language) => {
  return followClient.api.discover.rsshubAnalytics({
    ...(lang !== "all" && { lang }),
  })
}

export const fetchFeedTrending = ({
  lang,
  view,
  limit,
}: {
  lang?: "eng" | "cmn"
  view?: number
  limit: number
}) => {
  return followClient.api.trending.getFeeds({
    language: lang,
    view,
    limit,
  })
}
