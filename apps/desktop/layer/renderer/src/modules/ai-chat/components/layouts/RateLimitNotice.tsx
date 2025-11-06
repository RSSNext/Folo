import { cn } from "@follow/utils"
import type { ConfigResponse, TokenUsage } from "@follow-app/client-sdk"
import { m } from "motion/react"
import * as React from "react"

import { useSettingModal } from "~/modules/settings/modal/useSettingModal"

import { parseAIError } from "../../utils/error"

interface RateLimitNoticeProps {
  error?: Error
  chatConfig?: ConfigResponse
  className?: string
}

/**
 * RateLimitNotice component
 * Displays rate limit information above the input in a subtle, non-alarming way
 */
export const RateLimitNotice: React.FC<RateLimitNoticeProps> = ({
  error,
  chatConfig,
  className,
}) => {
  const message = React.useMemo(
    () =>
      chatConfig
        ? // @ts-expect-error Remove after the client-sdk update
          buildFreeUsageMessage(chatConfig.freeQuota) || buildTokenUsageMessage(chatConfig.usage)
        : error
          ? buildErrorMessage(error)
          : null,
    [chatConfig, error],
  )
  const settingModalPresent = useSettingModal()
  if (!message) {
    return
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
        <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">{message}</span>
      </div>
    </m.div>
  )
}

const formatResetTime = (windowResetTime: Date) => {
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

// Build compact message text
const buildErrorMessage = (error: Error) => {
  const parsedError = parseAIError(error)
  const { isRateLimitError, errorData } = parsedError
  // Only render for rate limit errors
  if (!isRateLimitError || !errorData) {
    return null
  }
  const remainingTokens = errorData.remainedTokens
  const resetTime = errorData.windowResetTime
    ? formatResetTime(new Date(errorData.windowResetTime))
    : null

  const parts: string[] = []
  // Tokens info
  if (remainingTokens !== undefined) {
    if (remainingTokens === 0) {
      parts.push("AI credits depleted")
    } else {
      parts.push(`${remainingTokens.toLocaleString()} credits left`)
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

/**
 * Normalize token data from error or direct usage input
 */
const buildTokenUsageMessage = (tokenUsage: TokenUsage) => {
  const remainingTokens = tokenUsage.remaining
  // Only render for rate limit errors or low token situations
  if (!remainingTokens) {
    return null
  }

  const resetTime = new Date(tokenUsage.resetAt)
  const formattedResetTime = resetTime ? formatResetTime(resetTime) : null

  // Build compact message text
  const parts: string[] = []

  // Tokens info
  if (remainingTokens !== undefined) {
    if (remainingTokens === 0) {
      parts.push("AI credits depleted")
    } else {
      parts.push(`${remainingTokens.toLocaleString()} credits left`)
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

/**
 * @deprecated Import from client-sdk
 */
interface FreeQuota {
  shouldCheckDailyLimit: boolean
  remainingRequests: number
  remainingMonthlyRequests: number
  role: string
  dailyLimit: number
  monthlyLimit: number
}

const buildFreeUsageMessage = (freeQuota: FreeQuota) => {
  if (!freeQuota.shouldCheckDailyLimit) {
    return
  }
  if (freeQuota.remainingRequests || freeQuota.remainingMonthlyRequests) {
    return
  }
  const parts: string[] = []
  parts.push("AI credits depleted")
  if (!freeQuota.remainingRequests && freeQuota.remainingMonthlyRequests) {
    parts.push("resets at tomorrow")
  } else {
    parts.push("resets at next month")
  }

  parts.push("Upgrade plan to get more AI credits.")
  return parts.join(" · ")
}
