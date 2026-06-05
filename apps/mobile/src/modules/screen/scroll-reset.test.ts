import { describe, expect, test } from "vitest"

import {
  getResetScrollSignalForContent,
  shouldApplyScrollResetSignal,
  shouldSuspendMarkReadForScrollReset,
} from "./scroll-reset"

describe("shouldApplyScrollResetSignal", () => {
  test("applies a new reset signal that has not been flushed yet", () => {
    expect(shouldApplyScrollResetSignal({ resetSignal: 1, appliedResetSignal: undefined })).toBe(
      true,
    )
    expect(shouldApplyScrollResetSignal({ resetSignal: 2, appliedResetSignal: 1 })).toBe(true)
  })

  test("does not apply missing or already flushed reset signals", () => {
    expect(
      shouldApplyScrollResetSignal({
        resetSignal: undefined,
        appliedResetSignal: undefined,
      }),
    ).toBe(false)
    expect(shouldApplyScrollResetSignal({ resetSignal: 1, appliedResetSignal: 1 })).toBe(false)
  })

  test("suspends mark-read while reset is pending", () => {
    expect(
      shouldSuspendMarkReadForScrollReset({
        resetSignal: 1,
        appliedResetSignal: undefined,
      }),
    ).toBe(true)
    expect(
      shouldSuspendMarkReadForScrollReset({
        resetSignal: 1,
        appliedResetSignal: 1,
      }),
    ).toBe(false)
  })

  test("does not forward reset signal to scrollable loading skeletons", () => {
    expect(
      getResetScrollSignalForContent({
        entryCount: 0,
        hasScrollableSkeleton: true,
        isReady: false,
        resetScrollSignal: 1,
      }),
    ).toBeUndefined()

    expect(
      getResetScrollSignalForContent({
        entryCount: 1,
        hasScrollableSkeleton: true,
        isReady: true,
        resetScrollSignal: 1,
      }),
    ).toBe(1)
  })
})
