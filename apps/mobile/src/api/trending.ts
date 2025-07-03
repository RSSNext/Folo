import type { Models } from "@follow/models"
import camelcaseKeys from "camelcase-keys"

import { apiFetch } from "../lib/api-fetch"

const v1ApiPrefix = "/v1"
export const getTrendingAggregates = async (params: { language: string }) => {
  const data = await apiFetch<Models.TrendingAggregates>(
    `${v1ApiPrefix}/trendings?language=${params.language}`,
    {
      params: {
        language: params.language,
      },
    },
  )
  return camelcaseKeys(data as any, { deep: true }) as Models.TrendingAggregates
}
