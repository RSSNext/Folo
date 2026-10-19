import { describe, expect, test } from "vitest"

import { canFetchNextPage } from "./next-page"

describe("canFetchNextPage", () => {
  test("waits while any page is fetched, including a refresh of the first one", () => {
    expect(canFetchNextPage({ hasNextPage: true, isFetching: true })).toBe(false)
    expect(canFetchNextPage({ hasNextPage: true, isFetching: false })).toBe(true)
  })

  test("never asks past the last page", () => {
    expect(canFetchNextPage({ hasNextPage: false, isFetching: false })).toBe(false)
  })
})
