import { describe, expect, test } from "vitest"

import { shouldScrollTimelineToTopOnRefreshStateChange } from "./refresh-reset"

describe("shouldScrollTimelineToTopOnRefreshStateChange", () => {
  test("scrolls only when the first-page refresh starts", () => {
    expect(
      shouldScrollTimelineToTopOnRefreshStateChange({
        wasRefreshing: false,
        isRefreshing: true,
      }),
    ).toBe(true)

    expect(
      shouldScrollTimelineToTopOnRefreshStateChange({
        wasRefreshing: true,
        isRefreshing: false,
      }),
    ).toBe(false)

    expect(
      shouldScrollTimelineToTopOnRefreshStateChange({
        wasRefreshing: true,
        isRefreshing: true,
      }),
    ).toBe(false)

    expect(
      shouldScrollTimelineToTopOnRefreshStateChange({
        wasRefreshing: false,
        isRefreshing: false,
      }),
    ).toBe(false)
  })
})
