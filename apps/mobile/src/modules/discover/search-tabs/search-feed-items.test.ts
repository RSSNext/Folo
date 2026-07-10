import { describe, expect, test } from "vitest"

import { resolveSearchFeedItems } from "./search-feed-items"

describe("resolveSearchFeedItems", () => {
  test.each(["folo://onboarding", "https://example.com/feed.xml"])(
    "creates a direct feed item for %s when discovery is empty",
    (url) => {
      expect(resolveSearchFeedItems([], url)).toEqual([
        {
          feed: {
            title: url,
            url,
          },
        },
      ])
    },
  )

  test("keeps an empty result for a keyword", () => {
    expect(resolveSearchFeedItems([], "technology news")).toEqual([])
  })

  test("prefers discovery results over a direct feed item", () => {
    const discoveredItems = [
      {
        feed: {
          id: "feed-id",
          title: "Discovered feed",
          url: "https://example.com/discovered.xml",
        },
      },
    ]

    expect(resolveSearchFeedItems(discoveredItems, "https://example.com/feed.xml")).toEqual(
      discoveredItems,
    )
  })
})
