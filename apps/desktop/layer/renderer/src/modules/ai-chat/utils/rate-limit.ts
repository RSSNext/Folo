import { getI18n } from "~/i18n"

import { parseAIError } from "./error"

interface FreeQuota {
  shouldCheckDailyLimit?: boolean
  remainingRequests?: number | null
  remainingMonthlyRequests?: number | null
}

interface Usage {
  remaining?: number | null
  resetAt?: string | Date
}

export interface AIConfigLike {
  usage?: Usage
  freeQuota?: FreeQuota
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
  configuration?: AIConfigLike | null,
): boolean {
  if (error) {
    const parsed = parseAIError(error)
    if (parsed.isRateLimitError) return true
  }
  if (configuration) {
    const conf = configuration
    if (typeof conf?.usage?.remaining === "number" && conf.usage.remaining <= 0) {
      return true
    }
    if (
      conf?.freeQuota?.shouldCheckDailyLimit &&
      (!conf.freeQuota.remainingRequests || !conf.freeQuota.remainingMonthlyRequests)
    ) {
      return true
    }
  }
  return false
}

export function computeRateLimitMessage(
  error: Error | string | undefined,
  configuration?: AIConfigLike | null,
): string | null {
  const i18n = getI18n()
  const { t } = i18n

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

      if (resetText) {
        parts.push(resetText)
      }

      return parts.join(" · ")
    }
  }

  if (configuration) {
    const conf = configuration

    if (conf?.freeQuota?.shouldCheckDailyLimit) {
      const daily = conf.freeQuota.remainingRequests
      const monthly = conf.freeQuota.remainingMonthlyRequests
      if (!daily || !monthly) {
        const parts: string[] = []
        parts.push(t("rate_limit.depleted", aiNs))
        if (!daily && monthly) {
          parts.push(t("rate_limit.resets_tomorrow", aiNs))
        } else {
          parts.push(t("rate_limit.resets_next_month", aiNs))
        }
        parts.push(t("rate_limit.upgrade_to_get_more", aiNs))
        return parts.join(" · ")
      }
      return null
    }

    const remaining = conf?.usage?.remaining
    if (typeof remaining === "number") {
      if (remaining > 0) return null
      const resetAt = conf?.usage?.resetAt ? new Date(conf.usage.resetAt) : null
      const formattedResetText = resetAt ? formatResetTime(resetAt) : null
      const parts: string[] = []
      if (remaining === 0) {
        parts.push(t("rate_limit.depleted", aiNs))
      } else {
        parts.push(t("rate_limit.credits_left", { ns: "ai", count: remaining }))
      }
      if (formattedResetText) {
        parts.push(formattedResetText)
      }
      if (parts.length < 2) {
        parts.push(t("rate_limit.upgrade_to_get_more", aiNs))
      }
      return parts.join(" · ")
    }
  }

  return null
}
