const DAY_IN_MS = 24 * 60 * 60 * 1000

export type ReviewPromptOutcome =
  | "dismissed"
  | "negative_feedback"
  | "positive_store_redirect"
  | "native_request"

export interface ReviewPromptState {
  firstSeenAt: string | null
  lastActiveDate: string | null
  activeDaysCount: number
  entryOpenCount: number
  subscriptionAddCount: number
  lastKnownSubscriptionCount: number
  paidConversionAt: string | null
  lastPromptAt: string | null
  lastPromptVersion: string | null
  lastOutcome: ReviewPromptOutcome | null
  autoPromptDisabled: boolean
}

export interface ReviewPromptEligibilityInput {
  appVersion: string
  isLoggedIn: boolean
  isInQuietWindow: boolean
  isPaidUser: boolean
  isPlatformSupported: boolean
  now: Date
  state: ReviewPromptState
}

export interface ReviewPromptEligibilityResult {
  allowed: boolean
  blockedBy: string | null
  cooldownUntil: string | null
  score: number
}

export const getReviewPromptDayKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const createReviewPromptState = (): ReviewPromptState => ({
  firstSeenAt: null,
  lastActiveDate: null,
  activeDaysCount: 0,
  entryOpenCount: 0,
  subscriptionAddCount: 0,
  lastKnownSubscriptionCount: 0,
  paidConversionAt: null,
  lastPromptAt: null,
  lastPromptVersion: null,
  lastOutcome: null,
  autoPromptDisabled: false,
})

export const normalizeReviewPromptState = (
  value: Partial<ReviewPromptState> | null | undefined,
): ReviewPromptState => ({
  ...createReviewPromptState(),
  ...value,
})

export const recordReviewPromptActiveDay = (
  state: ReviewPromptState,
  now: Date,
  dayKey = getReviewPromptDayKey(now),
): ReviewPromptState => {
  const nextState = normalizeReviewPromptState(state)

  if (!nextState.firstSeenAt) {
    nextState.firstSeenAt = now.toISOString()
  }

  if (nextState.lastActiveDate !== dayKey) {
    nextState.activeDaysCount += 1
    nextState.lastActiveDate = dayKey
  }

  return nextState
}

export const recordReviewPromptEntryOpen = (state: ReviewPromptState): ReviewPromptState => ({
  ...normalizeReviewPromptState(state),
  entryOpenCount: normalizeReviewPromptState(state).entryOpenCount + 1,
})

export const recordReviewPromptSubscriptionAdded = (
  state: ReviewPromptState,
  lastKnownSubscriptionCount?: number,
): ReviewPromptState => ({
  ...normalizeReviewPromptState(state),
  subscriptionAddCount: normalizeReviewPromptState(state).subscriptionAddCount + 1,
  lastKnownSubscriptionCount:
    typeof lastKnownSubscriptionCount === "number"
      ? lastKnownSubscriptionCount
      : normalizeReviewPromptState(state).lastKnownSubscriptionCount,
})

export const syncReviewPromptSubscriptionCount = (
  state: ReviewPromptState,
  lastKnownSubscriptionCount: number,
): ReviewPromptState => ({
  ...normalizeReviewPromptState(state),
  lastKnownSubscriptionCount,
})

export const recordReviewPromptPaidConversion = (
  state: ReviewPromptState,
  now: Date,
): ReviewPromptState => {
  const nextState = normalizeReviewPromptState(state)

  if (!nextState.paidConversionAt) {
    nextState.paidConversionAt = now.toISOString()
  }

  return nextState
}

export const recordReviewPromptOutcome = (
  state: ReviewPromptState,
  outcome: ReviewPromptOutcome,
  now: Date,
  appVersion: string,
): ReviewPromptState => ({
  ...normalizeReviewPromptState(state),
  autoPromptDisabled:
    outcome === "native_request" || outcome === "positive_store_redirect"
      ? true
      : normalizeReviewPromptState(state).autoPromptDisabled,
  lastOutcome: outcome,
  lastPromptAt: now.toISOString(),
  lastPromptVersion: appVersion,
})

export const getReviewPromptScore = (state: ReviewPromptState, isPaidUser: boolean) => {
  const nextState = normalizeReviewPromptState(state)

  let score = 0

  if (nextState.activeDaysCount >= 2) {
    score += 1
  }

  if (nextState.entryOpenCount >= 3) {
    score += 1
  }

  if (nextState.entryOpenCount >= 5) {
    score += 1
  }

  if (nextState.subscriptionAddCount >= 1) {
    score += 1
  }

  if (nextState.lastKnownSubscriptionCount >= 3) {
    score += 1
  }

  if (nextState.lastKnownSubscriptionCount >= 5) {
    score += 1
  }

  if (isPaidUser) {
    score += 3
  }

  return score
}

const getCooldownDays = (outcome: ReviewPromptOutcome | null) => {
  switch (outcome) {
    case "dismissed": {
      return 120
    }
    case "negative_feedback": {
      return 180
    }
    default: {
      return null
    }
  }
}

export const getReviewPromptCooldownUntil = (state: ReviewPromptState) => {
  const nextState = normalizeReviewPromptState(state)
  const cooldownDays = getCooldownDays(nextState.lastOutcome)

  if (!cooldownDays || !nextState.lastPromptAt) {
    return null
  }

  const lastPromptAt = new Date(nextState.lastPromptAt)
  if (Number.isNaN(lastPromptAt.getTime())) {
    return null
  }

  return new Date(lastPromptAt.getTime() + cooldownDays * DAY_IN_MS)
}

export const getReviewPromptEligibility = (
  input: ReviewPromptEligibilityInput,
): ReviewPromptEligibilityResult => {
  const { appVersion, isLoggedIn, isInQuietWindow, isPaidUser, isPlatformSupported, now } = input
  const state = normalizeReviewPromptState(input.state)
  const score = getReviewPromptScore(state, isPaidUser)

  if (!isLoggedIn) {
    return { allowed: false, blockedBy: "logged_out", cooldownUntil: null, score }
  }

  if (!isPlatformSupported) {
    return { allowed: false, blockedBy: "unsupported_platform", cooldownUntil: null, score }
  }

  if (!isInQuietWindow) {
    return { allowed: false, blockedBy: "not_quiet", cooldownUntil: null, score }
  }

  if (state.autoPromptDisabled) {
    return { allowed: false, blockedBy: "auto_prompt_disabled", cooldownUntil: null, score }
  }

  if (state.lastPromptVersion === appVersion) {
    return { allowed: false, blockedBy: "already_prompted_in_version", cooldownUntil: null, score }
  }

  const cooldownUntil = getReviewPromptCooldownUntil(state)
  if (cooldownUntil && cooldownUntil.getTime() > now.getTime()) {
    return {
      allowed: false,
      blockedBy: "cooldown_active",
      cooldownUntil: cooldownUntil.toISOString(),
      score,
    }
  }

  if (score < 3) {
    return { allowed: false, blockedBy: "score_too_low", cooldownUntil: null, score }
  }

  return { allowed: true, blockedBy: null, cooldownUntil: null, score }
}
