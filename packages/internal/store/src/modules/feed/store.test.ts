import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import type { FollowAPI } from "../../types"
import { getFeedServerId } from "./getter"
import { feedActions, feedSyncServices, useFeedStore } from "./store"
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

describe("a feed the server has not stored yet", () => {
  const url = "https://example.com/new.xml"
  const getFeed = vi.fn()

  beforeEach(() => {
    useFeedStore.setState({ feeds: {} })
    // The server answers for a new address with the parsed feed and an empty id
    getFeed.mockResolvedValue({ data: { feed: { type: "feed", id: "", title: "New", url } } })
    apiContext.provide({ feeds: { get: getFeed } } as unknown as FollowAPI)
  })

  it("is previewed under a nonce id that is never sent as its id", async () => {
    const { feed: preview } = await feedSyncServices.fetchFeedByUrl({ url })

    expect(useFeedStore.getState().feeds[preview.id]).toMatchObject({ url, nonce: preview.id })
    expect(getFeedServerId(preview.id)).toBeUndefined()
    feedActions.upsertManyInSession([feed({ id: "stored" })])
    expect(getFeedServerId("stored")).toBe("stored")
  })

  it("gives way to the feed stored for its URL", async () => {
    const { feed: preview } = await feedSyncServices.fetchFeedByUrl({ url })
    feedActions.upsertManyInSession([feed({ id: "other-preview", nonce: "n", url: "other" })])

    feedActions.upsertManyInSession([feed({ id: "stored", url })])

    const { feeds } = useFeedStore.getState()
    expect(feeds[preview.id]).toBeUndefined()
    expect(Object.keys(feeds).sort()).toEqual(["other-preview", "stored"])
  })

  it("keeps one preview when its address is fetched again", async () => {
    const { feed: first } = await feedSyncServices.fetchFeedByUrl({ url })
    const { feed: second } = await feedSyncServices.fetchFeedByUrl({ url })

    expect(Object.keys(useFeedStore.getState().feeds)).toEqual([second.id])
    expect(second.id).not.toBe(first.id)
  })
})
