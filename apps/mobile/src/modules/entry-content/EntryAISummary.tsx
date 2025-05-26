import { useEntry } from "@follow/store/src/entry/hooks"
import { SummaryGeneratingStatus } from "@follow/store/src/summary/enum"
import { usePrefetchSummary, useSummary } from "@follow/store/src/summary/hooks"
import { useSummaryStore } from "@follow/store/src/summary/store"
import { useAtomValue } from "jotai"
import type { FC } from "react"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"

import { AISummary } from "../ai/summary"
import { useEntryContentContext } from "./ctx"

export const EntryAISummary: FC<{
  entryId: string
}> = ({ entryId }) => {
  const ctx = useEntryContentContext()
  const showReadability = useAtomValue(ctx.showReadabilityAtom)
  const showAISummaryOnce = useAtomValue(ctx.showAISummaryAtom)
  const showAISummary = useGeneralSettingKey("summary") || showAISummaryOnce
  const entryReadabilityContent = useEntry(entryId, (state) => state.readabilityContent)
  const summary = useSummary(entryId)
  const actionLanguage = useActionLanguage()
  usePrefetchSummary({
    entryId,
    target: showReadability && entryReadabilityContent ? "readabilityContent" : "content",
    actionLanguage,
    enabled: showAISummary,
  })
  const summaryToShow = showReadability
    ? summary?.readabilitySummary || summary?.summary
    : summary?.summary

  const status = useSummaryStore((state) => state.generatingStatus[entryId])
  if (!showAISummary) return null

  return (
    <AISummary
      className="my-3"
      summary={summaryToShow}
      pending={status === SummaryGeneratingStatus.Pending}
      error={status === SummaryGeneratingStatus.Error ? "Failed to generate summary" : undefined}
    />
  )
}
