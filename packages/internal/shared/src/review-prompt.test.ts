import { describe, expect, it } from "vitest"

import {
  createReviewPromptState,
  getReviewPromptEligibility,
  getReviewPromptScore,
  recordReviewPromptActiveDay,
  recordReviewPromptEntryOpen,
  recordReviewPromptOutcome,
  recordReviewPromptSubscriptionAdded,
  syncReviewPromptSubscriptionCount,
} from "./review-prompt"

describe("review prompt scoring", () => {
  it("allows auto prompt with 2 active days, 3 entry opens, and 1 subscription add", () => {
    const now = new Date("2026-03-11T00:00:00.000Z")
    let state = createReviewPromptState()

    state = recordReviewPromptActiveDay(state, new Date("2026-03-10T00:00:00.000Z"), "2026-03-10")
    state = recordReviewPromptActiveDay(state, now, "2026-03-11")
    state = recordReviewPromptEntryOpen(state)
    state = recordReviewPromptEntryOpen(state)
    state = recordReviewPromptEntryOpen(state)
    state = recordReviewPromptSubscriptionAdded(state, 1)

    expect(getReviewPromptScore(state, false)).toBe(3)
    expect(
      getReviewPromptEligibility({
        appVersion: "1.0.0",
        isLoggedIn: true,
        isInQuietWindow: true,
        isPaidUser: false,
        isPlatformSupported: true,
        now,
        state,
      }).allowed,
    ).toBe(true)
  })

  it("adds an extra point when entry open count reaches 5", () => {
    let state = createReviewPromptState()

    for (let index = 0; index < 5; index += 1) {
      state = recordReviewPromptEntryOpen(state)
    }

    expect(getReviewPromptScore(state, false)).toBe(2)
  })

  it("does not allow auto prompt with only 2 active days and 3 entry opens", () => {
    const now = new Date("2026-03-11T00:00:00.000Z")
    let state = createReviewPromptState()

    state = recordReviewPromptActiveDay(state, new Date("2026-03-10T00:00:00.000Z"), "2026-03-10")
    state = recordReviewPromptActiveDay(state, now, "2026-03-11")
    state = recordReviewPromptEntryOpen(state)
    state = recordReviewPromptEntryOpen(state)
    state = recordReviewPromptEntryOpen(state)

    const result = getReviewPromptEligibility({
      appVersion: "1.0.0",
      isLoggedIn: true,
      isInQuietWindow: true,
      isPaidUser: false,
      isPlatformSupported: true,
      now,
      state,
    })

    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toBe("score_too_low")
  })

  it("allows paid users even when other signals are low", () => {
    const result = getReviewPromptEligibility({
      appVersion: "1.0.0",
      isLoggedIn: true,
      isInQuietWindow: true,
      isPaidUser: true,
      isPlatformSupported: true,
      now: new Date("2026-03-11T00:00:00.000Z"),
      state: createReviewPromptState(),
    })

    expect(result.allowed).toBe(true)
    expect(result.score).toBe(3)
  })
})

describe("review prompt cooldowns", () => {
  it("blocks the same version after dismissal", () => {
    const now = new Date("2026-03-11T00:00:00.000Z")
    const state = recordReviewPromptOutcome(createReviewPromptState(), "dismissed", now, "1.0.0")

    const result = getReviewPromptEligibility({
      appVersion: "1.0.0",
      isLoggedIn: true,
      isInQuietWindow: true,
      isPaidUser: true,
      isPlatformSupported: true,
      now,
      state,
    })

    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toBe("already_prompted_in_version")
  })

  it("keeps negative feedback in cooldown on later versions", () => {
    const state = recordReviewPromptOutcome(
      createReviewPromptState(),
      "negative_feedback",
      new Date("2026-03-01T00:00:00.000Z"),
      "1.0.0",
    )

    const result = getReviewPromptEligibility({
      appVersion: "1.0.1",
      isLoggedIn: true,
      isInQuietWindow: true,
      isPaidUser: true,
      isPlatformSupported: true,
      now: new Date("2026-03-11T00:00:00.000Z"),
      state,
    })

    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toBe("cooldown_active")
  })

  it("permanently disables auto prompt after native request", () => {
    const state = recordReviewPromptOutcome(
      createReviewPromptState(),
      "native_request",
      new Date("2026-03-01T00:00:00.000Z"),
      "1.0.0",
    )

    const result = getReviewPromptEligibility({
      appVersion: "1.0.1",
      isLoggedIn: true,
      isInQuietWindow: true,
      isPaidUser: true,
      isPlatformSupported: true,
      now: new Date("2026-03-11T00:00:00.000Z"),
      state,
    })

    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toBe("auto_prompt_disabled")
  })

  it("syncs subscription count without affecting other signals", () => {
    const state = syncReviewPromptSubscriptionCount(createReviewPromptState(), 5)

    expect(state.lastKnownSubscriptionCount).toBe(5)
    expect(state.subscriptionAddCount).toBe(0)
  })
})
