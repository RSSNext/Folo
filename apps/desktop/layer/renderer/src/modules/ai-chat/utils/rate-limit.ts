import type { FreeQuota, TokenUsage } from "@follow-app/client-sdk"

import { getI18n } from "~/i18n"

import { parseAIError } from "./error"

export interface AIConfigLike {
  usage?: TokenUsage
  freeQuota?: FreeQuota
}

export interface RateLimitMessageOptions {
  hideResetDetails?: boolean
}

const formatResetTime = (windowResetTime: Date) => {
  const i18n = getI18n()
  const { t } = i18n
  const resetDate = new Date(windowResetTime)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  const diffMinutes = Math.ceil(diffMs / (1000 * 60))

  if (diffMinutes < 60 && diffMinutes > 0) {
    const unit =
      diffMinutes === 1
        ? t("rate_limit.minute", { ns: "ai" })
        : t("rate_limit.minutes", { ns: "ai" })
    const value = `${diffMinutes} ${unit}`
    return t("rate_limit.resets_in", { ns: "ai", value })
  }

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return t("rate_limit.resets_at", { ns: "ai", time: timeFormatter.format(resetDate) })
}

export function computeIsRateLimited(
  error: Error | string | undefined,
  conf?: AIConfigLike | null,
): boolean {
  if (error) {
    const parsed = parseAIError(error)
    if (parsed.isRateLimitError) return true
  }

  if (conf) {
    return (
      !!conf?.freeQuota?.shouldCheckDailyLimit &&
      (!conf.freeQuota.remainingRequests || !conf.freeQuota.remainingMonthlyRequests)
    )
  }

  return false
}

export function computeRateLimitMessage(
  error: Error | string | undefined,
  configuration?: AIConfigLike | null,
  options?: RateLimitMessageOptions,
): string | null {
  const i18n = getI18n()
  const { t } = i18n
  const hideResetDetails = options?.hideResetDetails ?? false

  const aiNs = { ns: "ai" } as const
  if (error) {
    const parsed = parseAIError(error)
    const { isRateLimitError, errorData } = parsed
    if (isRateLimitError && errorData) {
      const remainingTokens = (errorData as any).remainedTokens as number | undefined
      const resetText = (errorData as any).windowResetTime
        ? formatResetTime(new Date((errorData as any).windowResetTime))
        : null

      const parts: string[] = []
      if (remainingTokens !== undefined) {
        if (remainingTokens === 0) {
          parts.push(t("rate_limit.depleted", aiNs))
        } else {
          parts.push(t("ai:rate_limit.credits_left", { count: remainingTokens }))
        }
      } else {
        if ((errorData as any).reason) {
          parts.push((errorData as any).reason)
        }
        parts.push(t("rate_limit.upgrade_to_get_more", aiNs))
      }

      if (resetText && !hideResetDetails) {
        parts.push(resetText)
      }

      return parts.join(" · ")
    }
  }

  if (!configuration) {
    return null
  }

  if (configuration?.freeQuota?.shouldCheckDailyLimit) {
    const daily = configuration.freeQuota.remainingRequests
    const monthly = configuration.freeQuota.remainingMonthlyRequests
    if (!daily || !monthly) {
      const parts: string[] = []
      parts.push(t("rate_limit.depleted", aiNs))
      if (!hideResetDetails) {
        if (!daily && monthly) {
          parts.push(t("rate_limit.resets_tomorrow", aiNs))
        } else {
          parts.push(t("rate_limit.resets_next_month", aiNs))
        }
      }
      parts.push(t("rate_limit.upgrade_to_get_more", aiNs))
      return parts.join(" · ")
    }
  }

  const remaining = configuration?.usage?.remaining

  if (typeof remaining === "number") {
    if (remaining > 0) return null
    const resetAt = configuration?.usage?.resetAt ? new Date(configuration.usage.resetAt) : null
    const formattedResetText = resetAt ? formatResetTime(resetAt) : null
    const parts: string[] = []
    if (remaining === 0) {
      parts.push(t("rate_limit.depleted", aiNs))
    } else {
      parts.push(t("rate_limit.credits_left", { ns: "ai", count: remaining }))
    }
    if (formattedResetText && !hideResetDetails) {
      parts.push(formattedResetText)
    }
    if (parts.length < 2) {
      parts.push(t("rate_limit.upgrade_to_get_more", aiNs))
    }
    return parts.join(" · ")
  }

  return null
}
