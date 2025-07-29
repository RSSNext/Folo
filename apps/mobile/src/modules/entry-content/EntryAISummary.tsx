import { useEntry } from "@follow/store/entry/hooks"
import { SummaryGeneratingStatus } from "@follow/store/summary/enum"
import { usePrefetchSummary, useSummary, useSummaryStatus } from "@follow/store/summary/hooks"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import { useCallback, useMemo } from "react"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { Text } from "@/src/components/ui/typography/Text"
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
  const entry = useEntry(
    entryId,
    useCallback(
      (state) => {
        const target =
          showReadability && state.readabilityContent ? "readabilityContent" : "content"
        return {
          target,
        } as const
      },
      [showReadability],
    ),
  )
  const actionLanguage = useActionLanguage()
  const summary = useSummary(entryId, actionLanguage)
  usePrefetchSummary({
    entryId,
    target: entry?.target || "content",
    actionLanguage,
    enabled: showAISummary,
  })
  const maybeMarkdown = showReadability
    ? summary?.readabilitySummary || summary?.summary
    : summary?.summary
  const summaryToShow = useMemo(() => {
    if (!maybeMarkdown) return null
    return renderMarkdown(maybeMarkdown)
  }, [maybeMarkdown])
  const status = useSummaryStatus({
    entryId,
    actionLanguage,
    target: entry?.target || "content",
  })
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
        rawSummaryForCopy={maybeMarkdown}
        summary={summaryToShow}
        pending={status === SummaryGeneratingStatus.Pending}
        error={status === SummaryGeneratingStatus.Error ? "Failed to generate summary" : undefined}
      />
    </ErrorBoundary>
  )
}
