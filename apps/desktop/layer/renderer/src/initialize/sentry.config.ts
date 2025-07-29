import { env } from "@follow/shared/env.desktop"
import type { BrowserOptions } from "@sentry/react"
import { FetchError } from "ofetch"

import { CustomSafeError } from "../errors/CustomSafeError"

const ERROR_PATTERNS = [
  /Network Error/i,
  /Fetch Error/i,
  /XHR Error/i,
  /adsbygoogle/i,
  /Failed to fetch/i,
  "fetch failed",
  "Unable to open cursor",
  "Document is not focused.",
  "HTTP Client Error",
  // Biz errors
  "Chain aborted",
  "The database connection is closing",
  "NotSupportedError",
]

export const SentryConfig: BrowserOptions = {
  // Performance Monitoring
  tracesSampleRate: 1, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", env.VITE_API_URL],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1,

  beforeSend(event, hint) {
    const error = hint.originalException
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isIgnoredError = ERROR_PATTERNS.some((pattern) =>
      pattern instanceof RegExp ? pattern.test(errorMessage) : errorMessage.includes(pattern),
    )

    if (isIgnoredError) {
      return null
    }

    const isPassthroughError = [CustomSafeError, FetchError].some((errorType) => {
      if (error instanceof errorType) {
        return true
      }
      return false
    })
    const isAbortError = error instanceof Error && error.name === "AbortError"

    if (isPassthroughError || isAbortError) {
      return null
    }

    if (error instanceof Error && "traceId" in error && error.traceId) {
      event.tags = {
        ...event.tags,
        traceId: error.traceId as string,
      }
    }

    return event
  },
}
