import { cn } from "@follow/utils"
import type { TokenUsage } from "@follow-app/client-sdk"
import { m } from "motion/react"
import * as React from "react"

import { useSettingModal } from "~/modules/settings/modal/useSettingModal"

import { parseAIError } from "../../utils/error"

interface RateLimitNoticeProps {
  error?: Error | string
  tokenUsage?: TokenUsage
  className?: string
}

interface NormalizedTokenData {
  remainingTokens?: number
  resetTime?: Date
  isRateLimit: boolean
}

/**
 * Normalize token data from error or direct usage input
 */
const normalizeTokenData = (
  error?: Error | string,
  tokenUsage?: TokenUsage,
): NormalizedTokenData => {
  // Prioritize direct token usage data
  if (tokenUsage) {
    return {
      remainingTokens: tokenUsage.remaining,
      resetTime: new Date(tokenUsage.resetAt),
      isRateLimit: tokenUsage.remaining === 0,
    }
  }

  // Fall back to error parsing
  if (error) {
    const parsedError = parseAIError(error)
    if (parsedError.isRateLimitError && parsedError.errorData) {
      return {
        remainingTokens: parsedError.errorData.remainedTokens,
        resetTime: parsedError.errorData.windowResetTime
          ? new Date(parsedError.errorData.windowResetTime)
          : undefined,
        isRateLimit: true,
      }
    }
  }

  return { isRateLimit: false }
}

/**
 * RateLimitNotice component
 * Displays rate limit information above the input in a subtle, non-alarming way
 */
export const RateLimitNotice: React.FC<RateLimitNoticeProps> = ({
  error,
  tokenUsage,
  className,
}) => {
  const normalizedData = React.useMemo(
    () => normalizeTokenData(error, tokenUsage),
    [error, tokenUsage],
  )
  const settingModalPresent = useSettingModal()

  // Only render for rate limit errors or low token situations
  if (!normalizedData.isRateLimit && !tokenUsage) {
    return null
  }

  const formatResetTime = (resetDate: Date) => {
    const now = new Date()
    const diffMs = resetDate.getTime() - now.getTime()
    const diffMinutes = Math.ceil(diffMs / (1000 * 60))

    if (diffMinutes <= 1) {
      return null
    }
    // Show relative time if less than 60 minutes
    if (diffMinutes < 60) {
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

  const { remainingTokens, resetTime } = normalizedData
  const formattedResetTime = resetTime ? formatResetTime(resetTime) : null

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
    }

    // Reset time
    if (formattedResetTime) {
      if (formattedResetTime.includes("minute")) {
        parts.push(`resets in ${formattedResetTime}`)
      } else {
        parts.push(`resets at ${formattedResetTime}`)
      }
    }
    if (parts.length < 2) {
      parts.push("Upgrade plan to get more AI credits.")
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
