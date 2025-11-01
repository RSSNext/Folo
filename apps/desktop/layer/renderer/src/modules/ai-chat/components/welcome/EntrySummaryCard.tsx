import { Spring } from "@follow/components/constants/spring.js"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { useActionLanguage } from "~/atoms/settings/general"
import { AISummaryCardBase } from "~/components/ui/ai-summary-card"
import { getFetchErrorInfo } from "~/lib/error-parser"

interface EntrySummaryCardProps {
  entryId: string
  className?: string
}

export const EntrySummaryCard: React.FC<EntrySummaryCardProps> = ({ entryId, className }) => {
  const { t } = useTranslation("ai")
  const actionLanguage = useActionLanguage()
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const summary = usePrefetchSummary({
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    actionLanguage,
    enabled: true,
  })
  const summaryErrorCode =
    summary.error instanceof Error ? getFetchErrorInfo(summary.error).code : undefined

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={Spring.presets.smooth}
      className="w-full max-w-2xl"
    >
      <AISummaryCardBase
        content={summary.data}
        isLoading={summary.isLoading}
        className={className}
        title={t("ai_summary")}
        errorCode={summaryErrorCode}
      />
    </m.div>
  )
}
