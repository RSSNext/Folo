import { env } from "@follow/shared/env.desktop"
import type { BrowserOptions } from "@sentry/react"
import {
  captureConsoleIntegration,
  eventFiltersIntegration,
  httpClientIntegration,
  moduleMetadataIntegration,
  reactRouterV6BrowserTracingIntegration,
} from "@sentry/react"
import { useEffect } from "react"
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from "react-router"

const ERROR_PATTERNS = [
  /Network Error/i,
  /Fetch Error/i,
  /XHR Error/i,
  /adsbygoogle/i,
  /Failed to fetch/i,
  "FetchError",
  "FollowAuthError",
  "fetch failed",
  "Unable to open cursor",
  "Document is not focused.",
  "Tracker",
  "HTTP Client Error",
  // Biz errors
  "Chain aborted",
  "The database connection is closing",
  "NotSupportedError",
  "Request failed",
  "The user rejected the request",
  "TypeError: Failed to fetch",
  "ResizeObserver loop completed with undelivered notifications",
  "ResizeObserver loop limit exceeded",
  "A mutation operation was attempted on a database that did not allow mutations",
  "401",
  "HTTP Client Error with status code: ",
  "DatabaseClosedError",
  "SecurityError",
  "NotFoundError",
  "Large Render Blocking Asset",
]

export const SentryConfig: BrowserOptions = {
  dsn: env.VITE_SENTRY_DSN,
  environment: RELEASE_CHANNEL,
  integrations: [
    eventFiltersIntegration(),
    moduleMetadataIntegration(),
    httpClientIntegration(),
    reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    captureConsoleIntegration({
      levels: ["error"],
    }),
  ],
  ignoreErrors: ERROR_PATTERNS,
  // Performance Monitoring
  tracesSampleRate: 1, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", env.VITE_API_URL],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1,

  beforeSend(event, hint) {
    const error = hint.originalException

    if (error instanceof Error && "traceId" in error && error.traceId) {
      event.tags = {
        ...event.tags,
        traceId: error.traceId as string,
      }
    }

    return event
  },
}
