import { Spring } from "@follow/components/constants/spring.js"
import { AIShortcutButton } from "@follow/components/ui/ai-shortcut-button/index.js"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { useActionLanguage } from "~/atoms/settings/general"
import { AISummaryCardBase } from "~/components/ui/ai-summary-card"

import { useSmartQuickActions } from "../../hooks/useSmartQuickActions"

interface EntrySummaryCardProps {
  entryId: string
  onSend: (message: string) => void
  className?: string
}

export const EntrySummaryCard: React.FC<EntrySummaryCardProps> = ({
  entryId,
  onSend,
  className,
}) => {
  const { t } = useTranslation("ai")
  const actionLanguage = useActionLanguage()
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const summary = usePrefetchSummary({
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    actionLanguage,
    enabled: true,
  })

  const quickActions = useSmartQuickActions(summary.data || null, entryId)

  const footerContent = summary.data && quickActions.length > 0 && (
    <div className="mt-6 space-y-3">
      <div className="text-text-secondary text-xs font-medium">
        {t("conversation_starters", { defaultValue: "Conversation starters" })}
      </div>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <AIShortcutButton
            key={action.id}
            onClick={() => onSend(action.prompt)}
            animationDelay={index * 0.1}
          >
            {action.label}
          </AIShortcutButton>
        ))}
      </div>
    </div>
  )

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
        footerContent={footerContent}
      />
    </m.div>
  )
}
