import { describe, expect, it } from "vitest"

import {
  getScrollMarkReadEndPadding,
  MIN_SCROLL_MARK_READ_END_PADDING,
  shouldRenderScrollMarkReadEndSpacer,
} from "./scroll-mark-read"

describe("scroll mark-read trailing space", () => {
  it("uses at least one viewport of trailing space on the final page", () => {
    expect(getScrollMarkReadEndPadding(720)).toBe(720)
  })

  it("falls back to a stable minimum before the viewport is measured", () => {
    expect(getScrollMarkReadEndPadding(null)).toBe(MIN_SCROLL_MARK_READ_END_PADDING)
    expect(getScrollMarkReadEndPadding(240)).toBe(MIN_SCROLL_MARK_READ_END_PADDING)
  })

  it("only enables the trailing spacer for non-empty final pages", () => {
    expect(shouldRenderScrollMarkReadEndSpacer({ entryCount: 3, hasNextPage: false })).toBe(true)
    expect(shouldRenderScrollMarkReadEndSpacer({ entryCount: 3, hasNextPage: true })).toBe(false)
    expect(shouldRenderScrollMarkReadEndSpacer({ entryCount: 0, hasNextPage: false })).toBe(false)
  })
})
