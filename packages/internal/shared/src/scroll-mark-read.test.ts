import { describe, expect, it } from "vitest"

import {
  getScrollMarkReadEndPadding,
  getScrollMarkReadMasonryStartIndex,
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

describe("scroll mark-read masonry start index", () => {
  const viewport = { viewportTop: 100, viewportBottom: 900 }

  it("starts at the first item still in view", () => {
    expect(
      getScrollMarkReadMasonryStartIndex({
        ...viewport,
        items: [
          { index: 0, top: -400, bottom: 50 },
          { index: 1, top: -300, bottom: 300 },
          { index: 2, top: -200, bottom: 80 },
          { index: 3, top: 60, bottom: 500 },
        ],
      }),
    ).toBe(1)
  })

  it("counts every item that left in the same frame", () => {
    expect(
      getScrollMarkReadMasonryStartIndex({
        ...viewport,
        items: [
          { index: 4, top: -500, bottom: 20 },
          { index: 5, top: -300, bottom: 40 },
          { index: 6, top: -200, bottom: 90 },
          { index: 7, top: -100, bottom: 100 },
          { index: 8, top: 150, bottom: 600 },
        ],
      }),
    ).toBe(8)
  })

  it("passes the last item once the list has scrolled past it", () => {
    expect(
      getScrollMarkReadMasonryStartIndex({
        ...viewport,
        items: [
          { index: 54, top: -700, bottom: -480 },
          { index: 55, top: -480, bottom: -60 },
          { index: 56, top: -480, bottom: -290 },
        ],
      }),
    ).toBe(57)
  })

  it("has no start index before any item has been laid out above or in view", () => {
    expect(getScrollMarkReadMasonryStartIndex({ ...viewport, items: [] })).toBeNull()
    expect(
      getScrollMarkReadMasonryStartIndex({
        ...viewport,
        items: [{ index: 3, top: 950, bottom: 1200 }],
      }),
    ).toBeNull()
  })

  it("ignores invalid indexes", () => {
    expect(
      getScrollMarkReadMasonryStartIndex({
        ...viewport,
        items: [
          { index: Number.NaN, top: 200, bottom: 400 },
          { index: -1, top: 200, bottom: 400 },
          { index: 2, top: -300, bottom: 0 },
        ],
      }),
    ).toBe(3)
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
