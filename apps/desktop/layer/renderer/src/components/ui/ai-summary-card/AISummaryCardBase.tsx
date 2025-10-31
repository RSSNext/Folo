import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils/utils"
import { isNeedUpgradeError } from "@follow-app/client-sdk"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useIsPaymentEnabled } from "~/atoms/server-configs"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { useFeature } from "~/hooks/biz/useFeature"
import { useSettingModal } from "~/modules/settings/modal/useSettingModal"

interface AISummaryCardBaseProps {
  /** Summary content to display */
  content?: string | null
  /** Whether the summary is currently loading */
  isLoading?: boolean
  /** Additional className for the container */
  className?: string
  /** Custom header content (replaces default AI Summary header) */
  headerContent?: ReactNode
  /** Additional content to render below the summary */
  footerContent?: ReactNode
  /** Custom loading state component */
  loadingComponent?: ReactNode
  /** Title text for the AI Summary header */
  title?: string
  /** Whether to show the copy button */
  showCopyButton?: boolean
  /** Whether to show the Ask AI button when there's content */
  showAskAIButton?: boolean
  /** Callback when Ask AI button is clicked */
  onAskAI?: () => void
  /** Error code returned when requesting the summary */
  errorCode?: number
}

const DefaultLoadingState = () => (
  <div className="space-y-2">
    <div className="h-3 w-full animate-pulse rounded-lg bg-material-ultra-thick" />
    <div className="h-3 w-[92%] animate-pulse rounded-lg bg-material-ultra-thick" />
    <div className="h-3 w-[85%] animate-pulse rounded-lg bg-material-ultra-thick" />
  </div>
)

const DefaultEmptyState = ({
  message,
  shouldSuggestUpgrade,
}: {
  message: string
  shouldSuggestUpgrade?: boolean
}) => {
  const settingModalPresent = useSettingModal()

  return (
    <div
      className="text-center"
      onClick={shouldSuggestUpgrade ? () => settingModalPresent("plan") : undefined}
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  )
}

export const AISummaryCardBase: React.FC<AISummaryCardBaseProps> = ({
  content,
  isLoading = false,
  className,
  headerContent,
  footerContent,
  loadingComponent,
  title = "AI Summary",
  showCopyButton = true,
  showAskAIButton = false,
  onAskAI,
  errorCode,
}) => {
  const { t } = useTranslation("app")
  const aiEnabled = useFeature("ai")
  const isPaymentEnabled = useIsPaymentEnabled()

  const hasContent = !isLoading && content
  const normalizedErrorCode = typeof errorCode === "number" ? errorCode : undefined
  const shouldSuggestUpgrade =
    normalizedErrorCode !== undefined && isPaymentEnabled && isNeedUpgradeError(normalizedErrorCode)

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200/50 p-5 backdrop-blur-xl",
        "bg-gradient-to-b from-neutral-50/80 to-white/40 dark:from-neutral-900/80 dark:to-neutral-900/40",
        "dark:border-neutral-800/50",

        isLoading &&
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
          isLoading && "animate-[glow_4s_ease-in-out_infinite]",
        )}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        {headerContent || (
          <div className="flex items-center gap-3">
            {/* Glowing AI icon */}
            <div className="center relative">
              <i
                className={cn(
                  "i-mgc-ai-cute-re text-lg",
                  isLoading
                    ? "text-purple-500/70 dark:text-purple-400/70"
                    : "text-purple-600 dark:text-purple-400",
                )}
              />
              <div
                className={cn(
                  "absolute inset-0 rounded-full blur-sm",
                  isLoading
                    ? "animate-[pulse_2s_infinite] bg-purple-400/30 dark:bg-purple-500/30"
                    : "animate-pulse bg-purple-400/20 dark:bg-purple-500/20",
                )}
              />
            </div>
            <span
              className={cn(
                "bg-gradient-to-r bg-clip-text font-medium text-transparent",
                isLoading
                  ? "from-purple-500/70 to-blue-500/70 dark:from-purple-400/70 dark:to-blue-400/70"
                  : "from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400",
              )}
            >
              {title}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {aiEnabled && showAskAIButton && hasContent && onAskAI && (
            <MotionButtonBase
              onClick={onAskAI}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-lg px-3 text-sm font-medium",
                "bg-gradient-to-r from-purple-500/10 to-blue-500/10",
                "border border-purple-200/30 dark:border-purple-800/30",
                "text-purple-600 dark:text-purple-400",
                "hover:from-purple-500/20 hover:to-blue-500/20",
                "hover:border-purple-300/50 dark:hover:border-purple-700/50",
                "transition-all duration-200",
                "backdrop-blur-sm",
                "sm:opacity-0 sm:duration-300 sm:group-hover:translate-y-0 sm:group-hover:opacity-100",
              )}
            >
              <i className="i-mingcute-ai-line text-base" />
              <span>Ask AI</span>
            </MotionButtonBase>
          )}

          {showCopyButton && hasContent && (
            <CopyButton
              value={content}
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
      </div>

      {/* Content */}
      <AutoResizeHeight className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {isLoading ? (
          loadingComponent || <DefaultLoadingState />
        ) : hasContent ? (
          <Markdown className="prose-sm max-w-none prose-p:m-0">{String(content)}</Markdown>
        ) : shouldSuggestUpgrade ? (
          <DefaultEmptyState
            message={t("ai.summary_upgrade_required_title")}
            shouldSuggestUpgrade
          />
        ) : (
          <DefaultEmptyState message={t("ai.summary_not_available")} />
        )}
      </AutoResizeHeight>

      {footerContent}
    </div>
  )
}
