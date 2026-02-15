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

const ATTRIBUTION_PREFIX_PATTERNS = [
  /^(?:(?:据|根据)\s*)?[^，。,:：\n]{1,40}(?:消息|报道|报告|监测|研究|统计|数据|分析)?(?:称|显示|指出|提到|认为|披露|公布)[，,:：]\s*/u,
  /^[^\n,.:;]{1,80}\s+(?:reported|reports|said|says|stated|states|noted|notes)\s*[,.:;]\s*/i,
  /^according to [^\n,.:;]{1,80}[,.:;]\s*/i,
] as const

const stripLeadingAttribution = (text: string) => {
  let result = text
  for (const pattern of ATTRIBUTION_PREFIX_PATTERNS) {
    result = result.replace(pattern, "")
  }
  return result
}

const normalizeSummaryText = (source?: string | null) => {
  if (!source) return ""

  const normalizedWhitespace = source
    .replaceAll(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replaceAll(/[ \t]+/g, " ")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim()

  if (!normalizedWhitespace) return ""

  const withoutAttribution = stripLeadingAttribution(normalizedWhitespace)

  return withoutAttribution
    .replace(/^[，。,:：\s]+/u, "")
    .replaceAll(/\s+([，。！？；：])/g, "$1")
    .trim()
}

const looksLikeMarkdown = (source: string) => {
  return /(?:^|\n)\s{0,3}(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|(?:^|\n)\s*[-*_]{3,}\s*(?:$|\n)|(?:^|\n)\|.+\|/m.test(
    source,
  )
}

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
  const { error: summaryError, refetch: refetchSummary } = usePrefetchSummary({
    entryId,
    target: entry?.target || "content",
    actionLanguage,
    enabled: showAISummary,
  })
  const maybeMarkdown = showReadability
    ? summary?.readabilitySummary || summary?.summary
    : summary?.summary
  const normalizedSummary = useMemo(() => normalizeSummaryText(maybeMarkdown), [maybeMarkdown])
  const summaryToShow = useMemo(() => {
    if (!normalizedSummary) return null
    if (!looksLikeMarkdown(normalizedSummary)) return normalizedSummary
    return renderMarkdown(normalizedSummary)
  }, [normalizedSummary])
  const status = useSummaryStatus({
    entryId,
    actionLanguage,
    target: entry?.target || "content",
  })
  const handleRetry = useCallback(() => {
    refetchSummary()
  }, [refetchSummary])
  if (!showAISummary) return null
  return (
    <ErrorBoundary
      fallbackRender={() => (
        <Text className="text-[16px] leading-[24px] text-label">
          Failed to generate summary. Rendering error.
        </Text>
      )}
    >
      <AISummary
        className="my-3"
        rawSummaryForCopy={normalizedSummary || undefined}
        summary={summaryToShow}
        pending={status === SummaryGeneratingStatus.Pending}
        error={summaryError}
        onRetry={status === SummaryGeneratingStatus.Error ? handleRetry : undefined}
      />
    </ErrorBoundary>
  )
}
