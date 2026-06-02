import { describe, expect, test } from "vitest"

import {
  getInitialScrollOffset,
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

  test("uses top offset while reset is pending", () => {
    expect(
      getInitialScrollOffset({
        cachedOffset: 320,
        resetSignal: 1,
        appliedResetSignal: undefined,
      }),
    ).toBe(0)

    expect(
      getInitialScrollOffset({
        cachedOffset: 320,
        resetSignal: 1,
        appliedResetSignal: 1,
      }),
    ).toBe(320)
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
})
