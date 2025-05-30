import { useEntry } from "@follow/store/entry/hooks"
import { SummaryGeneratingStatus } from "@follow/store/summary/enum"
import { usePrefetchSummary, useSummary } from "@follow/store/summary/hooks"
import { useSummaryStore } from "@follow/store/summary/store"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import { useMemo } from "react"
import { Text } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { renderMarkdown } from "@/src/lib/markdown"

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
  const summaryToShow = useMemo(() => {
    const maybeMarkdown = showReadability
      ? summary?.readabilitySummary || summary?.summary
      : summary?.summary
    if (!maybeMarkdown) return null

    return renderMarkdown(maybeMarkdown)
  }, [showReadability, summary?.readabilitySummary, summary?.summary])

  const status = useSummaryStore((state) => state.generatingStatus[entryId])
  if (!showAISummary) return null

  return (
    <ErrorBoundary
      fallbackRender={() => (
        <Text className="text-label text-[16px] leading-[24px]">
          Failed to generate summary. Rendering error.
        </Text>
      )}
    >
      <AISummary
        className="my-3"
        summary={summaryToShow}
        pending={status === SummaryGeneratingStatus.Pending}
        error={status === SummaryGeneratingStatus.Error ? "Failed to generate summary" : undefined}
      />
    </ErrorBoundary>
  )
}
