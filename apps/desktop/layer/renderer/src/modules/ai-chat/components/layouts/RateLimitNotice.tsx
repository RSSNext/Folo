import { cn } from "@follow/utils"
import { m } from "motion/react"
import * as React from "react"

import { useSettingModal } from "~/modules/settings/modal/useSettingModal"

import { parseAIError } from "../../utils/error"

interface RateLimitNoticeProps {
  error: Error | string
  className?: string
}

/**
 * RateLimitNotice component
 * Displays rate limit information above the input in a subtle, non-alarming way
 */
export const RateLimitNotice: React.FC<RateLimitNoticeProps> = ({ error, className }) => {
  const parsedError = React.useMemo(() => parseAIError(error), [error])
  const { isRateLimitError, errorData } = parsedError
  const settingModalPresent = useSettingModal()

  // Only render for rate limit errors
  if (!isRateLimitError || !errorData) {
    return null
  }

  const formatResetTime = (windowResetTime: string) => {
    const resetDate = new Date(windowResetTime)
    const now = new Date()
    const diffMs = resetDate.getTime() - now.getTime()
    const diffMinutes = Math.ceil(diffMs / (1000 * 60))

    // Show relative time if less than 60 minutes
    if (diffMinutes < 60 && diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`
    }

    // Otherwise show absolute time
    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    return timeFormatter.format(resetDate)
  }

  const remainingTokens = errorData.remainedTokens
  const resetTime = errorData.windowResetTime ? formatResetTime(errorData.windowResetTime) : null

  // Build compact message text
  const buildMessage = () => {
    const parts: string[] = []

    // Tokens info
    if (remainingTokens !== undefined) {
      if (remainingTokens === 0) {
        parts.push("AI tokens depleted")
      } else {
        parts.push(`${remainingTokens.toLocaleString()} tokens left`)
      }
    } else {
      parts.push("Upgrade plan to get more AI credits.")
    }

    // Reset time
    if (resetTime) {
      if (resetTime.includes("minute")) {
        parts.push(`resets in ${resetTime}`)
      } else {
        parts.push(`resets at ${resetTime}`)
      }
    }

    return parts.join(" · ")
  }

  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn("mb-3", className)}
      onClick={() => settingModalPresent("plan")}
    >
      <div className="flex items-center gap-2 rounded-lg border border-border bg-material-ultra-thick px-3 py-2 backdrop-blur-background">
        <i className="i-mgc-power size-4 flex-shrink-0 text-text" />
        <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
          {buildMessage()}
        </span>
      </div>
    </m.div>
  )
}
