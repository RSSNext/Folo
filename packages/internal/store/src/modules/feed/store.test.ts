import { describe, expect, it, vi } from "vitest"

import { feedActions, useFeedStore } from "./store"
import type { FeedModel } from "./types"

vi.mock("@follow/database/services/feed", () => ({
  FEED_EXTRA_DATA_KEYS: ["subscriptionCount", "updatesPerWeek", "latestEntryPublishedAt"],
  FeedService: {
    upsertMany: vi.fn(async () => {}),
    patch: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
  },
}))

const feed = (patch: Partial<FeedModel>) =>
  ({
    type: "feed",
    id: "feed-1",
    title: "Feed",
    url: "https://example.com/feed.xml",
    ...patch,
  }) as FeedModel

describe("feedActions.upsertManyInSession", () => {
  it("keeps stored analytics when the incoming feed has none", () => {
    feedActions.upsertManyInSession([feed({ subscriptionCount: 12, updatesPerWeek: 3 })])
    feedActions.upsertManyInSession([feed({ title: "Renamed" })])

    expect(useFeedStore.getState().feeds["feed-1"]).toMatchObject({
      title: "Renamed",
      subscriptionCount: 12,
      updatesPerWeek: 3,
    })
  })

  it("takes fresh analytics from a newer fetch", () => {
    feedActions.upsertManyInSession([feed({ subscriptionCount: 12 })])
    feedActions.upsertManyInSession([feed({ subscriptionCount: 15 })])

    expect(useFeedStore.getState().feeds["feed-1"]?.subscriptionCount).toBe(15)
  })
})
