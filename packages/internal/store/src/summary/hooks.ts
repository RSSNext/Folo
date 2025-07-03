import type { SupportedActionLanguage } from "@follow/shared"
import { useQuery } from "@tanstack/react-query"

import type { GeneralQueryOptions } from "../types"
import { summarySyncService, useSummaryStore } from "./store"
import { getGenerateSummaryStatusId } from "./utils"

export const useSummary = (entryId: string, language: SupportedActionLanguage) => {
  const summary = useSummaryStore((state) => state.data[entryId]?.[language])
  return summary
}

export const useSummaryStatus = ({
  entryId,
  actionLanguage,
  target,
}: {
  entryId: string
  actionLanguage: SupportedActionLanguage
  target: "content" | "readabilityContent"
}) => {
  const status = useSummaryStore(
    (state) => state.generatingStatus[getGenerateSummaryStatusId(entryId, actionLanguage, target)],
  )
  return status
}

export function usePrefetchSummary({
  entryId,
  target,
  actionLanguage,
  ...options
}: {
  entryId: string
  target: "content" | "readabilityContent"
  actionLanguage: SupportedActionLanguage
} & GeneralQueryOptions) {
  return useQuery({
    queryKey: ["summary", entryId, target, actionLanguage],
    queryFn: () => {
      return summarySyncService.generateSummary({ entryId, target, actionLanguage })
    },
    enabled: options?.enabled,
    staleTime: 1000 * 60 * 60 * 24,
  })
}
