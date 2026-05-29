import { FeedViewType } from "@follow/constants"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import type { FollowAPI } from "../../types"
import { useCollectionStore } from "../collection/store"
import { useFeedStore } from "../feed/store"
import { entrySyncServices, useEntryStore } from "./store"

const {
  collectionDeleteManyMock,
  collectionUpsertManyMock,
  entryGetManyMock,
  entryUpsertManyMock,
  feedUpsertManyMock,
} = vi.hoisted(() => ({
  collectionDeleteManyMock: vi.fn(),
  collectionUpsertManyMock: vi.fn(),
  entryGetManyMock: vi.fn(),
  entryUpsertManyMock: vi.fn(),
  feedUpsertManyMock: vi.fn(),
}))

vi.mock("@follow/database/services/collection", () => ({
  CollectionService: {
    deleteMany: collectionDeleteManyMock,
    getCollectionAll: vi.fn(),
    reset: vi.fn(),
    upsertMany: collectionUpsertManyMock,
  },
}))

vi.mock("@follow/database/services/entry", () => ({
  EntryService: {
    getEntryMany: entryGetManyMock,
    getEntriesToHydrate: vi.fn(),
    upsertMany: entryUpsertManyMock,
  },
}))

vi.mock("@follow/database/services/feed", () => ({
  FEED_EXTRA_DATA_KEYS: [],
  FeedService: {
    getFeedAll: vi.fn(),
    reset: vi.fn(),
    upsertMany: feedUpsertManyMock,
  },
}))

const createCollectionResponseItem = (index: number) => ({
  read: true,
  feeds: {
    id: "feed-1",
    title: "Feed",
    url: "https://example.com/feed.xml",
    image: null,
    description: null,
    ownerUserId: null,
    errorAt: null,
    errorMessage: null,
    siteUrl: "https://example.com",
  },
  entries: {
    id: `entry-${index}`,
    title: `Entry ${index}`,
    url: `https://example.com/${index}`,
    description: null,
    guid: `entry-${index}`,
    author: null,
    authorUrl: null,
    authorAvatar: null,
    insertedAt: "2026-03-01T00:00:00.000Z",
    publishedAt: "2026-02-01T00:00:00.000Z",
    media: null,
    categories: null,
    attachments: null,
    extra: null,
    language: null,
  },
  collections: {
    createdAt: `2026-03-${String(index).padStart(2, "0")}T00:00:00.000Z`,
  },
})

describe("entrySyncServices.fetchEntries", () => {
  const listEntriesMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    entryGetManyMock.mockResolvedValue([])
    entryUpsertManyMock.mockImplementation(async () => {})
    collectionUpsertManyMock.mockImplementation(async () => {})
    collectionDeleteManyMock.mockImplementation(async () => {})
    feedUpsertManyMock.mockImplementation(async () => {})

    useEntryStore.setState({
      data: {},
      entryIdByView: {
        [FeedViewType.All]: new Set(),
        [FeedViewType.Articles]: new Set(),
        [FeedViewType.Audios]: new Set(),
        [FeedViewType.Notifications]: new Set(),
        [FeedViewType.Pictures]: new Set(),
        [FeedViewType.SocialMedia]: new Set(),
        [FeedViewType.Videos]: new Set(),
      },
      entryIdByCategory: {},
      entryIdByFeed: {},
      entryIdByInbox: {},
      entryIdByList: {},
      entryIdSet: new Set(),
    })
    useCollectionStore.setState({ collections: {} })
    useFeedStore.setState({ feeds: {} })
    apiContext.provide({
      entries: {
        list: listEntriesMock,
      },
    } as unknown as FollowAPI)
  })

  it("keeps known collection entries when the first collection page can have more pages", async () => {
    useCollectionStore.setState({
      collections: Object.fromEntries(
        Array.from({ length: 25 }, (_, index) => {
          const entryId = `entry-${index + 1}`
          return [
            entryId,
            {
              entryId,
              feedId: "feed-1",
              view: FeedViewType.Articles,
              createdAt: `2026-03-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
            },
          ]
        }),
      ),
    })
    listEntriesMock.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => createCollectionResponseItem(index + 6)),
    })

    await entrySyncServices.fetchEntries({
      feedId: "collections",
      view: FeedViewType.Articles,
      limit: 20,
    })

    expect(Object.keys(useCollectionStore.getState().collections)).toHaveLength(25)
    expect(useCollectionStore.getState().collections["entry-1"]).toBeDefined()
  })
})
