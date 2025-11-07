import { cn } from "@follow/utils"
import { m } from "motion/react"

import { useIsInMASReview } from "~/atoms/server-configs"
import { useI18n } from "~/hooks/common/useI18n"
import { useSettingModal } from "~/modules/settings/modal/useSettingModal"

interface RateLimitNoticeProps {
  className?: string
  message?: string | null
}

/**
 * RateLimitNotice component
 * Displays rate limit information above the input in a subtle, non-alarming way
 */
export const RateLimitNotice = ({ className, message }: RateLimitNoticeProps) => {
  const t = useI18n()
  const settingModalPresent = useSettingModal()
  const isInMASReview = useIsInMASReview()

  if (!message || isInMASReview) {
    return
  }

  return (
    <m.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn("mb-3 block w-full text-left", className)}
      onClick={() => settingModalPresent("plan")}
    >
      <div className="flex items-center gap-2 rounded-lg border border-border bg-material-ultra-thick px-3 py-2 backdrop-blur-background">
        <i className="i-mgc-power size-4 flex-shrink-0 text-text" />
        <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">{message}</span>

        <button
          type="button"
          className="cursor-button text-xs text-accent duration-200 hover:opacity-80"
        >
          {t.ai("rate_limit.upgrade_plan_button" as any)}
        </button>
      </div>
    </m.button>
  )
}
