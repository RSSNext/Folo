import { useEntry } from "@follow/store/entry/hooks"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { useShowAISummary } from "~/atoms/ai-summary"
import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { setAIPanelVisibility, useAIPanelVisibility } from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { AISummaryCardBase } from "~/components/ui/ai-summary-card"

export function AISummary({ entryId }: { entryId: string }) {
  const { t } = useTranslation()
  const summarySetting = useEntry(entryId, (state) => state.settings?.summary)
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const showAISummary = useShowAISummary(summarySetting)

  const actionLanguage = useActionLanguage()

  // AI Chat panel state
  const isAIPanelVisible = useAIPanelVisibility()

  const summary = usePrefetchSummary({
    actionLanguage,
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    enabled: showAISummary,
  })

  // Ask AI only opens the AI panel, so it is left out while the panel is open, including a fixed
  // panel next to the entry once its chat has messages
  const shouldShowAskAI = !isAIPanelVisible

  const handleAskAI = () => {
    setAIPanelVisibility(true)
  }

  if (!showAISummary) {
    return null
  }

  return (
    <AISummaryCardBase
      content={summary.data}
      isLoading={summary.isLoading}
      // Only a finished summary belongs in an exported PDF, not its loading, upgrade or empty state
      className={cn("my-8", !summary.data && "print:hidden")}
      title={t("entry_content.ai_summary")}
      showAskAIButton={shouldShowAskAI}
      onAskAI={handleAskAI}
      error={summary.error}
    />
  )
}
