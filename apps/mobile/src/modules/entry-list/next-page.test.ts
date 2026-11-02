import { describe, expect, it } from "vitest"

import { canLoadNextPage, getNextPageFooterState, isLastEntryViewable } from "./next-page"

describe("canLoadNextPage", () => {
  it("asks only for a page that is neither loading nor failed", () => {
    expect(
      canLoadNextPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
      }),
    ).toBe(true)
    expect(
      canLoadNextPage({
        hasNextPage: false,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
      }),
    ).toBe(false)
    expect(
      canLoadNextPage({
        hasNextPage: true,
        isFetchingNextPage: true,
        isFetchNextPageError: false,
      }),
    ).toBe(false)
    expect(
      canLoadNextPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        isFetchNextPageError: true,
      }),
    ).toBe(false)
  })
})

describe("getNextPageFooterState", () => {
  it("ends the list only when there is no next page", () => {
    expect(
      getNextPageFooterState({
        hasNextPage: false,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
      }),
    ).toBe("end")
    // A failed request leaves the last page as the list's end
    expect(
      getNextPageFooterState({
        hasNextPage: false,
        isFetchingNextPage: false,
        isFetchNextPageError: true,
      }),
    ).toBe("end")
  })

  it("shows a retry after a failed next page instead of loading forever", () => {
    expect(
      getNextPageFooterState({
        hasNextPage: true,
        isFetchingNextPage: false,
        isFetchNextPageError: true,
      }),
    ).toBe("error")
  })

  it("loads while the next page is on its way", () => {
    expect(
      getNextPageFooterState({
        hasNextPage: true,
        isFetchingNextPage: true,
        isFetchNextPageError: false,
      }),
    ).toBe("loading")
  })

  it("waits for the last entry to be seen before asking for the next page", () => {
    expect(
      getNextPageFooterState({
        hasNextPage: true,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
      }),
    ).toBe("idle")
  })
})

describe("isLastEntryViewable", () => {
  it("tells when the last entry of the list is on screen", () => {
    expect(isLastEntryViewable([{ index: 3 }, { index: 4 }], 5)).toBe(true)
    expect(isLastEntryViewable([{ index: 2 }, { index: 3 }], 5)).toBe(false)
  })

  it("does not page an empty list or one whose viewability is unknown", () => {
    expect(isLastEntryViewable([{ index: 0 }], 0)).toBe(false)
    expect(isLastEntryViewable([{ index: null }], 1)).toBe(false)
    expect(isLastEntryViewable([], 1)).toBe(false)
  })
})
