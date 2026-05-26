import { describe, expect, it } from "vitest"

import {
  getScrollMarkReadEndPadding,
  getScrollMarkReadExitedSliceEnd,
  getScrollMarkReadRange,
  getScrollMarkReadRangeState,
  MIN_SCROLL_MARK_READ_END_PADDING,
  SCROLL_MARK_READ_END_INDICATOR_HEIGHT,
  shouldRenderScrollMarkReadEndSpacer,
} from "./scroll-mark-read"

describe("scroll mark-read trailing space", () => {
  it("leaves enough trailing space for the end indicator to stop at the top", () => {
    expect(getScrollMarkReadEndPadding(720)).toBe(720 - SCROLL_MARK_READ_END_INDICATOR_HEIGHT)
  })

  it("falls back to a stable minimum before the viewport is measured", () => {
    expect(getScrollMarkReadEndPadding(null)).toBe(MIN_SCROLL_MARK_READ_END_PADDING)
    expect(getScrollMarkReadEndPadding(240)).toBe(240 - SCROLL_MARK_READ_END_INDICATOR_HEIGHT)
  })

  it("only enables the trailing spacer for non-empty final pages", () => {
    expect(shouldRenderScrollMarkReadEndSpacer({ entryCount: 3, hasNextPage: false })).toBe(true)
    expect(shouldRenderScrollMarkReadEndSpacer({ entryCount: 3, hasNextPage: true })).toBe(false)
    expect(shouldRenderScrollMarkReadEndSpacer({ entryCount: 0, hasNextPage: false })).toBe(false)
  })
})

describe("scroll mark-read exited slice", () => {
  it("includes the first picture item after it scrolls out above the viewport", () => {
    expect(getScrollMarkReadExitedSliceEnd({ indexes: [0], renderedEndIndex: 0 })).toBe(1)
  })

  it("includes the picture item that crossed the top edge", () => {
    expect(getScrollMarkReadExitedSliceEnd({ indexes: [4], renderedEndIndex: 6 })).toBe(5)
  })

  it("ignores invalid indexes and items beyond the rendered range", () => {
    expect(
      getScrollMarkReadExitedSliceEnd({
        indexes: [Number.NaN, -1, 8],
        renderedEndIndex: 6,
      }),
    ).toBeNull()
  })
})

describe("scroll mark-read range", () => {
  it("marks the full skipped range when scrolling jumps over intermediate entries", () => {
    expect(
      getScrollMarkReadRange({
        previousEndIndex: 4,
        currentStartIndex: 12,
      }),
    ).toEqual({ startIndex: 4, endIndex: 12 })
  })

  it("does not mark entries while scrolling upward or staying within the previous high-water mark", () => {
    expect(
      getScrollMarkReadRange({
        previousEndIndex: 12,
        currentStartIndex: 8,
      }),
    ).toBeNull()
  })

  it("moves the anchor backward while scrolling up so entries can be retried", () => {
    expect(
      getScrollMarkReadRangeState({
        anchorIndex: 12,
        currentStartIndex: 8,
      }),
    ).toEqual({
      nextAnchorIndex: 8,
      range: null,
    })

    expect(
      getScrollMarkReadRangeState({
        anchorIndex: 8,
        currentStartIndex: 12,
      }),
    ).toEqual({
      nextAnchorIndex: 12,
      range: { startIndex: 8, endIndex: 12 },
    })
  })
})
