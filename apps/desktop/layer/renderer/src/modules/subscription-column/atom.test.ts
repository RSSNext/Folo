import { beforeEach, describe, expect, it } from "vitest"

import {
  getFeedListSort,
  migrateFeedListSortByName,
  setFeedListSortBy,
  setFeedListSortOrder,
  toggleFeedListSortBy,
} from "./atom"

describe("feed list sort", () => {
  beforeEach(() => {
    setFeedListSortBy("count")
    setFeedListSortOrder("desc")
  })

  it("switches from the most unread first to A to Z and back", () => {
    toggleFeedListSortBy()
    expect(getFeedListSort()).toEqual({ by: "alphabetical", order: "asc" })

    toggleFeedListSortBy()
    expect(getFeedListSort()).toEqual({ by: "count", order: "desc" })
  })

  it("keeps the name order a stored preference showed before the order was fixed", () => {
    // Clicking the sort button from the default order stored this, which listed A to Z
    setFeedListSortBy("alphabetical")
    migrateFeedListSortByName()
    expect(getFeedListSort()).toEqual({ by: "alphabetical", order: "asc" })

    setFeedListSortOrder("asc")
    migrateFeedListSortByName()
    expect(getFeedListSort()).toEqual({ by: "alphabetical", order: "desc" })
  })

  it("leaves a count order alone", () => {
    setFeedListSortOrder("asc")
    migrateFeedListSortByName()
    expect(getFeedListSort()).toEqual({ by: "count", order: "asc" })
  })
})
