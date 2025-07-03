import { apiClient } from "@/src/lib/api-fetch"

import type { DiscoverCategories, Language } from "./constants"

export const fetchRsshubPopular = (category: DiscoverCategories, lang: Language) => {
  return apiClient.discover.rsshub.$get({
    query: {
      category: "popular",
      categories: category === "all" ? "popular" : category,
      lang: lang === "all" ? undefined : lang,
    },
  })
}

export const fetchRsshubAnalysis = (lang: Language) => {
  return apiClient.discover["rsshub-analytics"].$get({
    query: {
      ...(lang !== "all" && { lang }),
    },
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
  return apiClient.trending.feeds.$get({
    query: {
      language: lang,
      view,
      limit,
    },
  })
}
