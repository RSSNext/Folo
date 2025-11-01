import { useEntry } from "@follow/store/entry/hooks"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { useTranslation } from "react-i18next"

import { useShowAISummary } from "~/atoms/ai-summary"
import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import {
  AIChatPanelStyle,
  setAIPanelVisibility,
  useAIChatPanelStyle,
  useAIPanelVisibility,
} from "~/atoms/settings/ai"
import { useActionLanguage } from "~/atoms/settings/general"
import { AISummaryCardBase } from "~/components/ui/ai-summary-card"
import { getFetchErrorInfo } from "~/lib/error-parser"

export function AISummary({ entryId }: { entryId: string }) {
  const { t } = useTranslation()
  const summarySetting = useEntry(entryId, (state) => state.settings?.summary)
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const showAISummary = useShowAISummary(summarySetting)
  const actionLanguage = useActionLanguage()

  // AI Chat panel state
  const aiChatPanelStyle = useAIChatPanelStyle()
  const isAIPanelVisible = useAIPanelVisibility()

  const summary = usePrefetchSummary({
    actionLanguage,
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    enabled: showAISummary,
  })
  const summaryErrorCode =
    summary.error instanceof Error ? getFetchErrorInfo(summary.error).code : undefined

  // Show Ask AI button when:
  // 1. Panel style is floating AND panel is not visible
  // 2. OR panel style is fixed (since fixed panel can be toggled)
  const shouldShowAskAI =
    (aiChatPanelStyle === AIChatPanelStyle.Floating && !isAIPanelVisible) ||
    aiChatPanelStyle === AIChatPanelStyle.Fixed

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
      showAskAIButton={shouldShowAskAI}
      onAskAI={handleAskAI}
      errorCode={summaryErrorCode}
    />
  )
}
