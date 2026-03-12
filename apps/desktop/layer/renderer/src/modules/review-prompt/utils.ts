import type { ReviewPromptOutcome, ReviewPromptState } from "@follow/shared/review-prompt"
import {
  createReviewPromptState,
  normalizeReviewPromptState,
  recordReviewPromptOutcome,
} from "@follow/shared/review-prompt"
import { tracker } from "@follow/tracker"
import { getStorageNS } from "@follow/utils/ns"

import { ipcServices } from "~/lib/client"

export const REVIEW_PROMPT_QUIET_WINDOW_MS = 5000

export type DesktopReviewDistribution = "mas" | "microsoft_store" | "unsupported"
export type DesktopReviewRateTarget = "mas" | "microsoft_store" | null

const APPLE_REVIEW_URL =
  "https://apps.apple.com/us/app/folo-follow-everything/id6739802604?action=write-review"
const MICROSOFT_PRODUCT_ID = "9NVFZPV0V0HT"
const MICROSOFT_REVIEW_URI = `ms-windows-store://review/?ProductId=${MICROSOFT_PRODUCT_ID}`
const MICROSOFT_REVIEW_URL = "https://apps.microsoft.com/detail/9nvfzpv0v0ht?mode=direct"
const SUPPORT_EMAIL = "support@folo.is"
const REVIEW_PROMPT_STORAGE_PREFIX = getStorageNS("review-prompt")

export const getDesktopReviewPlatform = () =>
  window.platform === "win32" ? "windows" : window.platform === "darwin" ? "macos" : "desktop"

export const getDesktopReviewDistribution = (): DesktopReviewDistribution => {
  if (typeof process !== "undefined" && process.mas) {
    return "mas"
  }

  if (window.api?.isWindowsStore) {
    return "microsoft_store"
  }

  return "unsupported"
}

export const getDesktopReviewRateTarget = (): DesktopReviewRateTarget => {
  if (window.platform === "darwin") {
    return "mas"
  }

  if (window.platform === "win32") {
    return "microsoft_store"
  }

  return null
}

export const getDesktopReviewDebugTarget = (): DesktopReviewRateTarget => {
  const defaultTarget = getDesktopReviewRateTarget()
  if (defaultTarget) {
    return defaultTarget
  }

  return /Windows/i.test(window.navigator.userAgent) ? "microsoft_store" : "mas"
}

export const getDesktopReviewStorageKey = (
  userId: string,
  distribution: DesktopReviewDistribution,
) => `${REVIEW_PROMPT_STORAGE_PREFIX}:${distribution}:${userId}`

const openExternal = async (url: string) => {
  if (ipcServices?.app.openExternal) {
    await ipcServices.app.openExternal(url)
    return
  }

  window.open(url, "_blank", "noopener,noreferrer")
}

export const openDesktopStoreReview = async (target: DesktopReviewRateTarget) => {
  switch (target) {
    case "mas": {
      await openExternal(APPLE_REVIEW_URL)
      return
    }
    case "microsoft_store": {
      try {
        await openExternal(MICROSOFT_REVIEW_URI)
      } catch {
        await openExternal(MICROSOFT_REVIEW_URL)
      }
      return
    }
    default: {
      return
    }
  }
}

export const openDesktopFeedbackEmail = async ({
  distribution,
  userId,
}: {
  distribution: DesktopReviewDistribution
  userId: string | null
}) => {
  const subject = "Folo feedback"
  const body = [
    "Hi Folo team,",
    "",
    "Here is my feedback:",
    "",
    `Platform: ${getDesktopReviewPlatform()}`,
    `Distribution: ${distribution}`,
    `Version: ${APP_VERSION}`,
    `User ID: ${userId ?? "anonymous"}`,
  ].join("\n")

  await openExternal(
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  )
}

export const readDesktopReviewPromptState = (storageKey: string | null): ReviewPromptState => {
  if (!storageKey) {
    return createReviewPromptState()
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return createReviewPromptState()
    }
    return normalizeReviewPromptState(JSON.parse(raw) as Partial<ReviewPromptState>)
  } catch {
    return createReviewPromptState()
  }
}

export const writeDesktopReviewPromptState = (
  storageKey: string | null,
  state: ReviewPromptState,
) => {
  if (!storageKey) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state))
}

export const clearDesktopReviewPromptState = (storageKey: string | null) => {
  if (!storageKey) {
    return
  }

  window.localStorage.removeItem(storageKey)
}

export const trackDesktopReviewOutcome = ({
  distribution,
  outcome,
  platform,
  score,
  source,
}: {
  distribution: DesktopReviewDistribution
  outcome: ReviewPromptOutcome
  platform: string
  score?: number
  source: "auto" | "manual"
}) => {
  switch (outcome) {
    case "dismissed": {
      tracker.reviewPromptDismissed({ distribution, platform, source })
      return
    }
    case "negative_feedback": {
      tracker.reviewPromptNegative({ distribution, platform, source })
      tracker.reviewPromptFeedbackOpened({ distribution, platform, source })
      return
    }
    case "positive_store_redirect": {
      tracker.reviewPromptPositive({ distribution, platform, source })
      tracker.reviewPromptStoreOpened({ distribution, platform, source })
      return
    }
    case "native_request": {
      tracker.reviewPromptNativeRequested({ distribution, platform, score, source })
    }
  }
}

export const persistDesktopReviewOutcome = ({
  appVersion,
  distribution,
  outcome,
  platform,
  score,
  source,
  state,
  storageKey,
}: {
  appVersion: string
  distribution: DesktopReviewDistribution
  outcome: ReviewPromptOutcome
  platform: string
  score?: number
  source: "auto" | "manual"
  state: ReviewPromptState
  storageKey: string | null
}) => {
  const nextState = recordReviewPromptOutcome(state, outcome, new Date(), appVersion)
  writeDesktopReviewPromptState(storageKey, nextState)
  trackDesktopReviewOutcome({ distribution, outcome, platform, score, source })
  return nextState
}
