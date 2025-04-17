import { useAtomValue } from "jotai"
import type { FC } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { SummaryGeneratingStatus } from "@/src/store/summary/enum"
import { usePrefetchSummary, useSummary } from "@/src/store/summary/hooks"
import { useSummaryStore } from "@/src/store/summary/store"

import { AISummary } from "../ai/summary"
import { useEntryContentContext } from "./ctx"

export const EntryAISummary: FC<{
  entryId: string
}> = ({ entryId }) => {
  const ctx = useEntryContentContext()
  const showReadability = useAtomValue(ctx.showReadabilityAtom)
  const showAISummaryOnce = useAtomValue(ctx.showAISummaryAtom)
  const showAISummary = useGeneralSettingKey("summary") || showAISummaryOnce
  const summary = useSummary(entryId)
  usePrefetchSummary(entryId, showReadability ? "readabilityContent" : "content", {
    enabled: showAISummary,
  })

  const status = useSummaryStore((state) => state.generatingStatus[entryId])
  if (!showAISummary) return null

  return (
    <AISummary
      className="my-3"
      summary={
        showReadability
          ? summary?.readabilitySummary || summary?.summary || ""
          : summary?.summary || ""
      }
      pending={status === SummaryGeneratingStatus.Pending}
      error={status === SummaryGeneratingStatus.Error ? "Failed to generate summary" : undefined}
    />
  )
}
