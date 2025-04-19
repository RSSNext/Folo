import { useQuery } from "@tanstack/react-query"

import { summarySyncService, useSummaryStore } from "./store"

export const useSummary = (entryId: string) => {
  const summary = useSummaryStore((state) => state.data[entryId])
  return summary
}

export const useSummaryStatus = (entryId: string) => {
  const status = useSummaryStore((state) => state.generatingStatus[entryId])
  return status
}

export const usePrefetchSummary = (
  entryId: string,
  target: "content" | "readabilityContent",
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["summary", entryId, target],
    queryFn: () => {
      return summarySyncService.generateSummary(entryId, target)
    },
    enabled: options?.enabled,
    staleTime: 1000 * 60 * 60 * 24,
  })
}
