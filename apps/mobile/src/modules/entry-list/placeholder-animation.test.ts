import { describe, expect, it } from "vitest"

import {
  shouldAnimateLoadingPlaceholder,
  shouldAnimateNextPagePlaceholder,
} from "./placeholder-animation"

describe("shouldAnimateLoadingPlaceholder", () => {
  it("animates on the shown page and on lists outside the pager", () => {
    expect(shouldAnimateLoadingPlaceholder({ active: true })).toBe(true)
    expect(shouldAnimateLoadingPlaceholder({})).toBe(true)
  })

  it("holds still on a pager page next to the shown one", () => {
    expect(shouldAnimateLoadingPlaceholder({ active: false })).toBe(false)
  })
})

describe("shouldAnimateNextPagePlaceholder", () => {
  it("animates while the next page loads", () => {
    expect(shouldAnimateNextPagePlaceholder({ active: true, isFetchingNextPage: true })).toBe(true)
    expect(shouldAnimateNextPagePlaceholder({ isFetchingNextPage: true })).toBe(true)
  })

  it("holds still while nothing loads, as the list keeps it far below the screen", () => {
    expect(shouldAnimateNextPagePlaceholder({ active: true, isFetchingNextPage: false })).toBe(
      false,
    )
  })

  it("holds still on a page that is not shown", () => {
    expect(shouldAnimateNextPagePlaceholder({ active: false, isFetchingNextPage: true })).toBe(
      false,
    )
  })
})
