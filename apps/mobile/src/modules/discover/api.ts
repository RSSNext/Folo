import { apiClient } from "@/src/lib/api-fetch"

import type { DiscoverCategories, Language } from "./constants"

export const fetchRsshubPopular = (category: DiscoverCategories, lang: Language) => {
  return apiClient.discover.rsshub.$get({
    query: {
      category: "popular",
      categories: category === "all" ? "popular" : `popular,${category}`,
      lang: lang === "all" ? undefined : lang,
    },
  })
}
