import { describe, expect, test } from "vitest"

import { shouldCollectViewableItemsForMarkRead } from "./viewable-mark-read"

describe("shouldCollectViewableItemsForMarkRead", () => {
  test("does not collect viewable items while disabled", () => {
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: true,
        isScrollingDown: true,
        offset: 120,
      }),
    ).toBe(false)
  })

  test("collects viewable items only when scrolling down beyond the top", () => {
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: false,
        isScrollingDown: true,
        offset: 120,
      }),
    ).toBe(true)
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: false,
        isScrollingDown: false,
        offset: 120,
      }),
    ).toBe(false)
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: false,
        isScrollingDown: true,
        offset: 0,
      }),
    ).toBe(false)
  })
})
