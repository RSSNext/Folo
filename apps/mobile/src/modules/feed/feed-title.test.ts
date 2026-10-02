import { beforeEach, describe, expect, it, vi } from "vitest"

import { getPreferredFeedTitle } from "./feed-title"

const mocks = vi.hoisted(() => ({
  feeds: {} as Record<string, { title: string | null }>,
  subscriptions: {} as Record<string, { title: string | null }>,
}))

vi.mock("@follow/store/feed/getter", () => ({
  getFeedById: (id: string) => mocks.feeds[id],
}))

vi.mock("@follow/store/feed/hooks", () => ({
  useFeedById: vi.fn(),
}))

vi.mock("@follow/store/subscription/getter", () => ({
  getSubscriptionByFeedId: (id: string) => mocks.subscriptions[id],
}))

vi.mock("@follow/store/subscription/hooks", () => ({
  useSubscriptionByFeedId: vi.fn(),
}))

describe("getPreferredFeedTitle", () => {
  beforeEach(() => {
    mocks.feeds = { "feed-1": { title: "Original Title" } }
    mocks.subscriptions = {}
  })

  it("prefers the custom subscription title", () => {
    mocks.subscriptions = { "feed-1": { title: "My Title" } }

    expect(getPreferredFeedTitle("feed-1")).toBe("My Title")
  })

  it("falls back to the feed title without a custom title", () => {
    expect(getPreferredFeedTitle("feed-1")).toBe("Original Title")

    mocks.subscriptions = { "feed-1": { title: null } }
    expect(getPreferredFeedTitle("feed-1")).toBe("Original Title")

    mocks.subscriptions = { "feed-1": { title: "" } }
    expect(getPreferredFeedTitle("feed-1")).toBe("Original Title")
  })

  it("returns undefined when nothing is known about the feed", () => {
    expect(getPreferredFeedTitle(undefined)).toBeUndefined()
    expect(getPreferredFeedTitle(null)).toBeUndefined()
    expect(getPreferredFeedTitle("unknown-feed")).toBeUndefined()

    mocks.feeds = { "feed-1": { title: null } }
    expect(getPreferredFeedTitle("feed-1")).toBeUndefined()
  })
})
