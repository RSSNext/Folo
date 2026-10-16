import { describe, expect, test } from "vitest"

import { addFollowedToImportResult, splitFollowedOpmlItems } from "./opml-import"

const followedFeedIdByUrl = new Map([["https://sspai.com/feed", "feed-sspai"]])

describe("splitFollowedOpmlItems", () => {
  test("separates the feeds the user already follows", () => {
    const { followed, rest } = splitFollowedOpmlItems(
      [
        { url: "https://sspai.com/feed", title: "少数派" },
        { url: "https://overreacted.io/rss.xml", title: "overreacted" },
      ],
      followedFeedIdByUrl,
    )

    expect(followed).toEqual([{ id: "feed-sspai", url: "https://sspai.com/feed", title: "少数派" }])
    expect(rest).toEqual([{ url: "https://overreacted.io/rss.xml", title: "overreacted" }])
  })
})

describe("addFollowedToImportResult", () => {
  const followed = [{ id: "feed-sspai", url: "https://sspai.com/feed", title: "少数派" }]

  test("counts the followed feeds the server left out as already subscribed", () => {
    const result = addFollowedToImportResult(
      {
        successfulItems: [{ id: "feed-overreacted", url: "https://overreacted.io/rss.xml" }],
        conflictItems: [],
        parsedErrorItems: [{ url: "https://example.com/not-a-feed.xml" }],
      },
      followed,
    )

    expect(result.successfulItems).toHaveLength(1)
    expect(result.conflictItems).toEqual(followed)
    expect(result.parsedErrorItems).toHaveLength(1)
  })

  test("does not count a feed the server already reported twice", () => {
    const result = addFollowedToImportResult(
      { successfulItems: [], conflictItems: followed, parsedErrorItems: [] },
      followed,
    )

    expect(result.conflictItems).toHaveLength(1)
  })
})
