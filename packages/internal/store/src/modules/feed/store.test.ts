import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import type { FollowAPI } from "../../types"
import { findFeedByUrl, getFeedByUrl, getFeedServerId } from "./getter"
import { feedActions, feedSyncServices, useFeedStore } from "./store"
import type { FeedModel } from "./types"

const { documents, storedFeeds } = vi.hoisted(() => ({
  documents: new Map<string, string>(),
  storedFeeds: [] as unknown[],
}))

vi.mock("@follow/database/services/feed", () => ({
  FEED_EXTRA_DATA_KEYS: ["subscriptionCount", "updatesPerWeek", "latestEntryPublishedAt"],
  FeedService: {
    getFeedAll: vi.fn(async () => storedFeeds),
    upsertMany: vi.fn(async () => {}),
    patch: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
  },
}))

vi.mock("@follow/database/services/sync-meta", () => ({
  SyncMetaService: {
    get: vi.fn(async (key: string) => documents.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      documents.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      documents.delete(key)
    }),
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
    useFeedStore.setState({ feeds: {}, resolvedUrls: {} })
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

  it("waits for the server, which gives the feed's source 70 s, to say why it failed", async () => {
    getFeed.mockClear()
    await feedSyncServices.fetchFeedByUrl({ url })

    const [, options] = getFeed.mock.calls[0] as [unknown, { timeout?: number } | undefined]
    expect(options?.timeout).toBeGreaterThan(70_000)
  })
})

describe("a feed the server keeps under another URL than its address", () => {
  const address = "http://localhost:1200/test/sort"
  const url = "rsshub://test/sort"

  beforeEach(() => {
    documents.clear()
    storedFeeds.length = 0
    useFeedStore.setState({ feeds: {}, resolvedUrls: {} })
    const getFeed = vi.fn(async () => ({
      data: { feed: { type: "feed", id: "", title: "", url } },
    }))
    apiContext.provide({ feeds: { get: getFeed } } as unknown as FollowAPI)
  })

  it("is found by its address once it was looked up, and after it is followed", async () => {
    expect(getFeedByUrl(address)).toBeUndefined()

    const { feed: preview } = await feedSyncServices.fetchFeedByUrl({ url: address })
    expect(getFeedByUrl(address)?.id).toBe(preview.id)

    // Following it brings the stored feed in place of the preview
    feedActions.upsertManyInSession([feed({ id: "feed-sort", url })])
    expect(getFeedByUrl(address)?.id).toBe("feed-sort")
    expect(getFeedByUrl(url)?.id).toBe("feed-sort")
  })

  it("matches only the URL its address was looked up as", () => {
    const state = {
      feeds: { sort: feed({ id: "sort", url }), other: feed({ id: "other", url: address }) },
      resolvedUrls: { [address]: url },
    }

    expect(findFeedByUrl(state, address)?.id).toBe("sort")
    expect(findFeedByUrl(state, "http://localhost:1200/test/other")).toBeUndefined()
    expect(findFeedByUrl({ ...state, resolvedUrls: {} }, address)?.id).toBe("other")
  })

  it("is still found by its address after the app restarts", async () => {
    await feedSyncServices.fetchFeedByUrl({ url: address })
    await vi.waitFor(() => expect(documents.has("feed:resolved-urls")).toBe(true))

    // A new launch starts from what the database holds: the followed feed and the addresses
    useFeedStore.setState({ feeds: {}, resolvedUrls: {} })
    storedFeeds.push(feed({ id: "feed-sort", url }))
    await feedActions.hydrate()

    expect(getFeedByUrl(address)?.id).toBe("feed-sort")
  })

  it("keeps only the most recently resolved addresses", async () => {
    for (let index = 0; index <= 100; index++) {
      await feedActions.setResolvedUrl(`http://localhost:1200/test/${index}`, `rsshub://${index}`)
    }
    // Resolving an address again makes it the most recent one
    await feedActions.setResolvedUrl("http://localhost:1200/test/1", "rsshub://one")

    const stored = JSON.parse(documents.get("feed:resolved-urls")!) as Record<string, string>
    expect(Object.keys(stored)).toHaveLength(100)
    expect(stored).not.toHaveProperty(["http://localhost:1200/test/0"])
    expect(Object.entries(stored).at(-1)).toEqual(["http://localhost:1200/test/1", "rsshub://one"])
    expect(useFeedStore.getState().resolvedUrls).toEqual(stored)
  })

  it("forgets the addresses on sign-out", async () => {
    await feedActions.setResolvedUrl(address, url)

    await feedActions.reset()

    expect(useFeedStore.getState().resolvedUrls).toEqual({})
    expect(documents.has("feed:resolved-urls")).toBe(false)
  })
})
