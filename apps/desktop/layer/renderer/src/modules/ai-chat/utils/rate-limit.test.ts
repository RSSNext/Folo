import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { computeRateLimitMessage } from "./rate-limit"

vi.mock("~/i18n", () => ({
  getI18n: () => ({
    language: "en-GB",
    resolvedLanguage: "en-GB",
    t: (key: string, options?: Record<string, unknown>) => {
      switch (key) {
        case "rate_limit.depleted": {
          return "AI credits depleted"
        }
        case "rate_limit.minute": {
          return "minute"
        }
        case "rate_limit.minutes": {
          return "minutes"
        }
        case "rate_limit.resets_at": {
          return `resets at ${options?.time as string}`
        }
        case "rate_limit.resets_in": {
          return `resets in ${options?.value as string}`
        }
        case "rate_limit.credits_left": {
          return `${options?.count as number} credits left`
        }
        case "rate_limit.upgrade_to_get_more": {
          return "Start free trial to get more AI credits."
        }
        default: {
          return key
        }
      }
    },
  }),
}))

describe("computeRateLimitMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows only the time when credits reset later today", () => {
    vi.setSystemTime(new Date(2026, 3, 10, 8, 0))

    const message = computeRateLimitMessage(undefined, {
      usage: {
        total: 5_000_000,
        used: 5_000_000,
        remaining: 0,
        resetAt: new Date(2026, 3, 10, 20, 45),
      },
    })

    expect(message).toBe("AI credits depleted · resets at 20:45")
  })

  it("includes the date when credits reset on a future day", () => {
    vi.setSystemTime(new Date(2026, 3, 10, 8, 0))

    const message = computeRateLimitMessage(undefined, {
      usage: {
        total: 5_000_000,
        used: 5_000_000,
        remaining: 0,
        resetAt: new Date(2026, 3, 12, 20, 45),
      },
    })

    expect(message).toBe("AI credits depleted · resets at 12 Apr, 20:45")
  })
})
