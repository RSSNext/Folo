import { useEntry } from "@follow/store/entry/hooks"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { useTranslation } from "react-i18next"

import { useShowAISummary } from "~/atoms/ai-summary"
import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { setAIPanelVisibility } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { AISummaryCardBase } from "~/components/ui/ai-summary-card"

export function AISummary({ entryId }: { entryId: string }) {
  const { t } = useTranslation()
  const summarySetting = useEntry(entryId, (state) => state.settings?.summary)
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const showAISummary = useShowAISummary(summarySetting)

  const actionLanguage = useActionLanguage()

  const summary = usePrefetchSummary({
    actionLanguage,
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    enabled: showAISummary,
  })

  const handleAskAI = () => {
    setAIPanelVisibility(true)
  }

  if (!showAISummary || (!summary.isLoading && !summary.data)) {
    return null
  }

  return (
    <AISummaryCardBase
      content={summary.data}
      isLoading={summary.isLoading}
      className="my-8"
      title={t("entry_content.ai_summary")}
      showAskAIButton={true}
      onAskAI={handleAskAI}
      error={summary.error}
    />
  )
}
