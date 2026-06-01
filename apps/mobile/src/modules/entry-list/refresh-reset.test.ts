import { describe, expect, test } from "vitest"

import { shouldScrollEntryListToTopOnRefreshStateChange } from "./refresh-reset"

describe("shouldScrollEntryListToTopOnRefreshStateChange", () => {
  test("scrolls only when the first-page refresh starts", () => {
    expect(
      shouldScrollEntryListToTopOnRefreshStateChange({
        wasRefreshing: false,
        isRefreshing: true,
      }),
    ).toBe(true)

    expect(
      shouldScrollEntryListToTopOnRefreshStateChange({
        wasRefreshing: true,
        isRefreshing: false,
      }),
    ).toBe(false)

    expect(
      shouldScrollEntryListToTopOnRefreshStateChange({
        wasRefreshing: true,
        isRefreshing: true,
      }),
    ).toBe(false)

    expect(
      shouldScrollEntryListToTopOnRefreshStateChange({
        wasRefreshing: false,
        isRefreshing: false,
      }),
    ).toBe(false)
  })
})
