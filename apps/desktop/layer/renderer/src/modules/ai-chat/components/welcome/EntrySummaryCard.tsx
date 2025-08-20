import { Spring } from "@follow/components/constants/spring.js"
import { AIShortcutButton } from "@follow/components/ui/ai-shortcut-button/index.js"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { usePrefetchSummary } from "@follow/store/summary/hooks"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { useActionLanguage } from "~/atoms/settings/general"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"

import { useSmartQuickActions } from "../../hooks/useSmartQuickActions"

interface EntrySummaryCardProps {
  entryId: string
  onSend: (message: string) => void
  className?: string
}

const SummaryLoadingState = () => (
  <div className="space-y-2">
    <div className="bg-material-ultra-thick h-3 w-full animate-pulse rounded-lg" />
    <div className="bg-material-ultra-thick h-3 w-[92%] animate-pulse rounded-lg" />
    <div className="bg-material-ultra-thick h-3 w-[85%] animate-pulse rounded-lg" />
  </div>
)

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

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={Spring.presets.smooth}
      className={cn(
        // Reuse AISummary visual patterns but optimized for chat context
        "group relative w-full max-w-2xl overflow-hidden rounded-2xl border p-6 backdrop-blur-xl",
        "bg-gradient-to-b from-neutral-50/80 to-white/40 dark:from-neutral-900/80 dark:to-neutral-900/40",
        "border-neutral-200/50 dark:border-neutral-800/50",
        "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        summary.isLoading &&
          "before:absolute before:inset-0 before:-z-10 before:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] before:bg-gradient-to-r before:from-purple-100/0 before:via-purple-300/10 before:to-purple-100/0 dark:before:from-purple-900/0 dark:before:via-purple-600/10 dark:before:to-purple-900/0",
        className,
      )}
    >
      {/* Animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-br opacity-50",
          "from-purple-100/20 via-transparent to-blue-100/20",
          "dark:from-purple-900/20 dark:to-blue-900/20",
          summary.isLoading && "animate-[glow_4s_ease-in-out_infinite]",
        )}
      />

      {/* Header with entry context */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="center relative">
            <i
              className={cn(
                "i-mgc-ai-cute-re text-lg",
                summary.isLoading
                  ? "text-purple-500/70 dark:text-purple-400/70"
                  : "text-purple-600 dark:text-purple-400",
              )}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-sm",
                summary.isLoading
                  ? "animate-[pulse_2s_infinite] bg-purple-400/30 dark:bg-purple-500/30"
                  : "animate-pulse bg-purple-400/20 dark:bg-purple-500/20",
              )}
            />
          </div>
          <span
            className={cn(
              "bg-gradient-to-r bg-clip-text font-medium text-transparent",
              summary.isLoading
                ? "from-purple-500/70 to-blue-500/70 dark:from-purple-400/70 dark:to-blue-400/70"
                : "from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400",
            )}
          >
            {t("ai_summary", { defaultValue: "AI Summary" })}
          </span>
        </div>

        {summary.data && (
          <CopyButton
            value={summary.data}
            variant="outline"
            className={cn(
              "!bg-white/10 !text-purple-600 dark:!text-purple-400",
              "hover:!bg-white/20 dark:hover:!bg-neutral-800/30",
              "!border-purple-200/30 dark:!border-purple-800/30",
              "sm:opacity-0 sm:duration-300 sm:group-hover:translate-y-0 sm:group-hover:opacity-100",
              "backdrop-blur-sm",
            )}
          />
        )}
      </div>

      {/* Summary Content */}
      <AutoResizeHeight className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {summary.isLoading ? (
          <SummaryLoadingState />
        ) : summary.data ? (
          <div className="animate-in fade-in-0 duration-500">
            <Markdown className="prose-sm prose-p:m-0 max-w-none">{String(summary.data)}</Markdown>
          </div>
        ) : (
          <div className="py-4 text-center">
            <i className="i-mgc-document-cute-re text-text-tertiary mb-2 text-2xl" />
            <p className="text-text-secondary text-sm">
              {t("summary_not_available", { defaultValue: "Summary not available" })}
            </p>
          </div>
        )}
      </AutoResizeHeight>

      {/* Smart Quick Actions */}
      {summary.data && quickActions.length > 0 && (
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
      )}
    </m.div>
  )
}
