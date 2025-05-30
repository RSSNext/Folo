import type { SupportedActionLanguage } from "@follow/shared"
import { useQuery } from "@tanstack/react-query"

import type { GeneralQueryOptions } from "../types"
import { summarySyncService, useSummaryStore } from "./store"

export const useSummary = (entryId: string) => {
  const summary = useSummaryStore((state) => state.data[entryId])
  return summary
}

export const useSummaryStatus = (entryId: string) => {
  const status = useSummaryStore((state) => state.generatingStatus[entryId])
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
    queryKey: ["summary", entryId, target],
    queryFn: () => {
      return summarySyncService.generateSummary({ entryId, target, actionLanguage })
    },
    enabled: options?.enabled,
    staleTime: 1000 * 60 * 60 * 24,
  })
}
