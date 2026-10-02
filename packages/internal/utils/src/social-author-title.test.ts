import { describe, expect, it } from "vitest"

import { getSocialAuthorTitle } from "./social-author-title"

describe("getSocialAuthorTitle", () => {
  it("keeps the author when the subscription has no custom title", () => {
    expect(getSocialAuthorTitle({ author: "Alice", feedTitle: "Alice的微博" })).toBe("Alice")
    expect(getSocialAuthorTitle({ author: null, feedTitle: "Channel" })).toBe("Channel")
  })

  it("uses the custom title when the post has no author", () => {
    expect(
      getSocialAuthorTitle({ author: "", feedTitle: "Channel", subscriptionTitle: "My Channel" }),
    ).toBe("My Channel")
  })

  it("uses the custom title when the author is the account the feed follows", () => {
    expect(
      getSocialAuthorTitle({
        author: "Alice",
        feedTitle: "Alice的微博",
        subscriptionTitle: "Friend",
      }),
    ).toBe("Friend")
    expect(
      getSocialAuthorTitle({ author: "Channel", feedTitle: "Channel", subscriptionTitle: "Mine" }),
    ).toBe("Mine")
  })

  it("keeps the author of posts by someone else", () => {
    expect(
      getSocialAuthorTitle({
        author: "Bob",
        feedTitle: "Alice的微博",
        subscriptionTitle: "Friend",
      }),
    ).toBe("Bob")
  })

  it("ignores a subscription title that equals the feed title", () => {
    expect(
      getSocialAuthorTitle({ author: "Alice", feedTitle: "Alice", subscriptionTitle: "Alice" }),
    ).toBe("Alice")
  })
})
