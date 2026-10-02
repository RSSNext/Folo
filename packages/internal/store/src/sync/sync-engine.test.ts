import { FeedViewType } from "@follow/constants"
import { FollowAPIError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext, syncApiContext } from "../context"
import { useCollectionStore } from "../modules/collection/store"
import { useEntryStore } from "../modules/entry/store"
import type { EntryModel } from "../modules/entry/types"
import { useInboxStore } from "../modules/inbox/store"
import { useListStore } from "../modules/list/store"
import { useSubscriptionStore } from "../modules/subscription/store"
import { unreadActions, unreadSyncService, useUnreadStore } from "../modules/unread/store"
import { useUserStore } from "../modules/user/store"
import type { FollowAPI } from "../types"
import { registerSyncModel } from "./model-registry"
import { syncEngine } from "./sync-engine"
import { isSyncEngineActive } from "./sync-status"
import { transactionQueue } from "./transaction-queue"
import type { SyncAction, SyncAPI } from "./types"

const {
  syncMetaStore,
  syncMetaGetMock,
  syncMetaSetMock,
  entryPatchManyMock,
  subscriptionPatchMock,
  subscriptionDeleteMock,
  collectionUpsertManyMock,
  collectionDeleteManyMock,
  listDeleteMock,
  inboxDeleteByIdMock,
  entryDeleteManyMock,
  unreadUpsertManyMock,
  invalidateEntriesQueryMock,
  refreshEntriesHeadMock,
  setFeedUnreadDirtyMock,
} = vi.hoisted(() => {
  const syncMetaStore = new Map<string, string>()
  return {
    syncMetaStore,
    syncMetaGetMock: vi.fn(async (key: string) => syncMetaStore.get(key) ?? null),
    syncMetaSetMock: vi.fn(async (key: string, value: string) => {
      syncMetaStore.set(key, value)
    }),
    entryPatchManyMock: vi.fn(async () => {}),
    subscriptionPatchMock: vi.fn(async () => {}),
    subscriptionDeleteMock: vi.fn(async () => {}),
    collectionUpsertManyMock: vi.fn(async () => {}),
    collectionDeleteManyMock: vi.fn(async () => {}),
    listDeleteMock: vi.fn(async () => {}),
    inboxDeleteByIdMock: vi.fn(async () => {}),
    entryDeleteManyMock: vi.fn(async () => {}),
    unreadUpsertManyMock: vi.fn(async () => {}),
    invalidateEntriesQueryMock: vi.fn(),
    refreshEntriesHeadMock: vi.fn(async () => {}),
    setFeedUnreadDirtyMock: vi.fn(),
  }
})

vi.mock("@follow/database/services/sync-meta", () => ({
  SyncMetaService: {
    get: syncMetaGetMock,
    set: syncMetaSetMock,
    delete: vi.fn(async (key: string) => {
      syncMetaStore.delete(key)
    }),
    reset: vi.fn(async () => syncMetaStore.clear()),
  },
}))
vi.mock("@follow/database/services/sync-transaction", () => ({
  SyncTransactionService: {
    insert: vi.fn(async () => {}),
    deleteMany: vi.fn(async () => {}),
    getAll: vi.fn(async () => []),
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("@follow/database/services/entry", () => ({
  EntryService: {
    patchMany: entryPatchManyMock,
    getEntryMany: vi.fn(async () => []),
    upsertMany: vi.fn(async () => {}),
    deleteMany: entryDeleteManyMock,
  },
}))
vi.mock("@follow/database/services/subscription", () => ({
  SubscriptionService: {
    getSubscriptionAll: vi.fn(async () => []),
    upsertMany: vi.fn(async () => {}),
    patch: subscriptionPatchMock,
    delete: subscriptionDeleteMock,
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("@follow/database/services/feed", () => ({
  FEED_EXTRA_DATA_KEYS: [],
  FeedService: {
    upsertMany: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("@follow/database/services/list", () => ({
  ListService: {
    upsertMany: vi.fn(async () => {}),
    deleteList: listDeleteMock,
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("@follow/database/services/inbox", () => ({
  InboxService: {
    upsertMany: vi.fn(async () => {}),
    deleteById: inboxDeleteByIdMock,
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("@follow/database/services/collection", () => ({
  CollectionService: {
    upsertMany: collectionUpsertManyMock,
    deleteMany: collectionDeleteManyMock,
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("@follow/database/services/unread", () => ({
  UnreadService: {
    upsertMany: unreadUpsertManyMock,
    reset: vi.fn(async () => {}),
  },
}))
vi.mock("../modules/entry/hooks", () => ({
  invalidateEntriesQuery: invalidateEntriesQueryMock,
  refreshEntriesHead: refreshEntriesHeadMock,
}))
vi.mock("../modules/feed/hooks", () => ({
  setFeedUnreadDirty: setFeedUnreadDirtyMock,
  clearFeedUnreadDirty: vi.fn(),
  clearAllFeedUnreadDirty: vi.fn(),
}))

const createEntry = (id: string, feedId: string, read = false): EntryModel => ({
  id,
  guid: `${id}-guid`,
  insertedAt: new Date("2026-01-01T00:00:00.000Z"),
  publishedAt: new Date("2026-01-01T00:00:00.000Z"),
  feedId,
  read,
})

const createAction = (overrides: Partial<SyncAction> & Pick<SyncAction, "id">): SyncAction => ({
  model: "timeline",
  modelId: null,
  action: "U",
  data: null,
  createdAt: "2026-09-16T00:00:00.000Z",
  ...overrides,
})

/** A client that already bootstrapped and calibrated recently: pulls are purely incremental. */
const seedCursor = (lastSyncId: number, calibratedAt = Date.now()) => {
  syncMetaStore.set("lastSyncId", String(lastSyncId))
  syncMetaStore.set("unreadCalibratedAt", String(calibratedAt))
  syncMetaStore.set("subscriptionsCalibratedAt", String(calibratedAt))
}

const deltaResponse = (
  actions: SyncAction[],
  options: { hasMore?: boolean; reset?: boolean; lastSyncId?: number } = {},
) => ({
  code: 0 as const,
  data: {
    actions,
    lastSyncId: options.lastSyncId ?? actions.at(-1)?.id ?? 0,
    hasMore: options.hasMore ?? false,
    reset: options.reset ?? false,
  },
})

describe("syncEngine", () => {
  const stateMock = vi.fn()
  const deltaMock = vi.fn()
  const subscriptionsGetMock = vi.fn()
  const readsGetMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    syncMetaStore.clear()
    syncEngine.clearInSession()
    transactionQueue.clearInSession()

    useUserStore.setState((state) => ({ ...state, whoami: { id: "user-1" } as never }))
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
    useSubscriptionStore.setState((state) => ({
      ...state,
      data: {},
      subscriptionIdSet: new Set(),
      feedIdByView: {
        [FeedViewType.All]: new Set(),
        [FeedViewType.Articles]: new Set(),
        [FeedViewType.Audios]: new Set(),
        [FeedViewType.Notifications]: new Set(),
        [FeedViewType.Pictures]: new Set(),
        [FeedViewType.SocialMedia]: new Set(),
        [FeedViewType.Videos]: new Set(),
      },
      listIdByView: {
        [FeedViewType.All]: new Set(),
        [FeedViewType.Articles]: new Set(),
        [FeedViewType.Audios]: new Set(),
        [FeedViewType.Notifications]: new Set(),
        [FeedViewType.Pictures]: new Set(),
        [FeedViewType.SocialMedia]: new Set(),
        [FeedViewType.Videos]: new Set(),
      },
      categories: {
        [FeedViewType.All]: new Set(),
        [FeedViewType.Articles]: new Set(),
        [FeedViewType.Audios]: new Set(),
        [FeedViewType.Notifications]: new Set(),
        [FeedViewType.Pictures]: new Set(),
        [FeedViewType.SocialMedia]: new Set(),
        [FeedViewType.Videos]: new Set(),
      },
    }))
    useCollectionStore.setState({ collections: {} })
    useListStore.setState({ lists: {}, listIds: [] })
    useInboxStore.setState({ inboxes: {} })
    unreadActions.upsertManyInSession([], { reset: true })

    subscriptionsGetMock.mockResolvedValue({ data: [] })
    readsGetMock.mockResolvedValue({ data: {} })
    apiContext.provide({
      subscriptions: { get: subscriptionsGetMock },
      reads: { get: readsGetMock },
    } as unknown as FollowAPI)
    syncApiContext.provide({ state: stateMock, delta: deltaMock } as SyncAPI)
  })

  afterEach(() => {
    syncEngine.clearInSession()
    transactionQueue.clearInSession()
  })

  it("bootstraps on the first pull and stores the server's sync id", async () => {
    stateMock.mockResolvedValue({ code: 0, data: { lastSyncId: 42 } })

    await syncEngine.pull("launch")

    expect(stateMock).toHaveBeenCalledTimes(1)
    expect(subscriptionsGetMock).toHaveBeenCalledTimes(1)
    expect(readsGetMock).toHaveBeenCalledTimes(1)
    expect(deltaMock).not.toHaveBeenCalled()
    expect(syncEngine.getLastSyncId()).toBe(42)
    expect(syncMetaStore.get("lastSyncId")).toBe("42")
    expect(isSyncEngineActive()).toBe(true)
  })

  it("applies list membership changes and list deletion", async () => {
    seedCursor(40)
    const { subscriptionActions } = await import("../modules/subscription/store")
    const { listActions } = await import("../modules/list/store")
    listActions.upsertManyInSession([
      {
        id: "list-1",
        title: "Reading",
        userId: "owner-1",
        ownerUserId: "owner-1",
        description: null,
        image: null,
        view: FeedViewType.Articles,
        feedIds: ["feed-1"],
        fee: 0,
        subscriptionCount: null,
        purchaseAmount: null,
        type: "list",
      },
    ])
    subscriptionActions.upsertManyInSession([
      {
        feedId: null,
        listId: "list-1",
        inboxId: null,
        userId: "user-1",
        view: FeedViewType.Articles,
        isPrivate: false,
        hideFromTimeline: null,
        title: null,
        category: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        type: "list",
      },
    ])
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 41,
          model: "list",
          modelId: "list-1",
          action: "U",
          data: { feedIds: ["feed-1", "feed-2"], title: "Reading list" },
        }),
      ]),
    )

    await syncEngine.pull("interval")

    expect(useListStore.getState().lists["list-1"]?.feedIds).toEqual(["feed-1", "feed-2"])
    expect(useListStore.getState().lists["list-1"]?.title).toBe("Reading list")
    expect(readsGetMock).toHaveBeenCalledTimes(1)
    expect(invalidateEntriesQueryMock).toHaveBeenCalledTimes(1)

    deltaMock.mockResolvedValueOnce(
      deltaResponse([createAction({ id: 42, model: "list", modelId: "list-1", action: "D" })]),
    )
    await syncEngine.pull("interval")

    expect(useListStore.getState().lists["list-1"]).toBeUndefined()
    expect(useSubscriptionStore.getState().data["list-1"]).toBeUndefined()
    expect(listDeleteMock).toHaveBeenCalledWith("list-1")
    expect(subscriptionDeleteMock).toHaveBeenCalledWith(["list/list-1"])
  })

  it("applies the inbox lifecycle, new inbox entries and inbox entry deletions", async () => {
    seedCursor(50)
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 51,
          model: "inbox",
          modelId: "news",
          action: "I",
          data: {
            inboxes: { type: "inbox", id: "news", secret: "s3cret", title: "News" },
            feedId: "inbox-news",
            title: "News",
            userId: "user-1",
            inboxId: "news",
            view: 0,
            category: null,
            isPrivate: false,
            hideFromTimeline: null,
            createdAt: "",
          },
        }),
        createAction({
          id: 52,
          model: "inbox",
          modelId: "news",
          action: "U",
          data: { title: "Daily" },
        }),
        createAction({
          id: 53,
          model: "timeline",
          modelId: "news",
          action: "N",
          data: {
            inboxId: "news",
            isInbox: true,
            count: 1,
            entryIds: ["mail-1"],
            latestPublishedAt: "2026-09-17T00:00:00.000Z",
            from: [],
          },
        }),
      ]),
    )

    await syncEngine.pull("interval")

    expect(useInboxStore.getState().inboxes.news).toMatchObject({
      id: "news",
      title: "Daily",
      secret: "s3cret",
    })
    expect(useSubscriptionStore.getState().data["inbox/news"]).toMatchObject({
      inboxId: "news",
      type: "inbox",
      title: "Daily",
    })
    expect(setFeedUnreadDirtyMock).toHaveBeenCalledWith("news")
    expect(readsGetMock).toHaveBeenCalledTimes(1)

    useEntryStore.setState((state) => ({
      ...state,
      data: { "mail-1": { ...createEntry("mail-1", ""), feedId: null, inboxHandle: "news" } },
      entryIdSet: new Set(["mail-1"]),
      entryIdByInbox: { news: new Set(["mail-1"]) },
    }))
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 54,
          model: "inbox_entry",
          modelId: "mail-1",
          action: "D",
          data: { inboxId: "news" },
        }),
        createAction({ id: 55, model: "inbox", modelId: "news", action: "D" }),
      ]),
    )
    await syncEngine.pull("interval")

    expect(useEntryStore.getState().data["mail-1"]).toBeUndefined()
    expect(entryDeleteManyMock).toHaveBeenCalledWith(["mail-1"])
    expect(useInboxStore.getState().inboxes.news).toBeUndefined()
    expect(useSubscriptionStore.getState().data["inbox/news"]).toBeUndefined()
    expect(inboxDeleteByIdMock).toHaveBeenCalledWith("news")
  })

  it("tells the transaction queue how far the change log was applied", async () => {
    seedCursor(60)
    const markSyncedSpy = vi.spyOn(transactionQueue, "markSynced")
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({ id: 61, model: "collection", modelId: "entry-9", action: "D" }),
      ]),
    )

    await syncEngine.pull("interval")

    expect(markSyncedSpy).toHaveBeenCalledWith(61)
    markSyncedSpy.mockRestore()
  })

  it("applies subscription updates and deletes from the delta", async () => {
    seedCursor(10)
    const { subscriptionActions } = await import("../modules/subscription/store")
    subscriptionActions.upsertManyInSession([
      {
        feedId: "feed-1",
        listId: null,
        inboxId: null,
        userId: "user-1",
        view: FeedViewType.Articles,
        isPrivate: false,
        hideFromTimeline: null,
        title: null,
        category: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        type: "feed",
      },
      {
        feedId: "feed-2",
        listId: null,
        inboxId: null,
        userId: "user-1",
        view: FeedViewType.Articles,
        isPrivate: false,
        hideFromTimeline: null,
        title: null,
        category: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        type: "feed",
      },
    ])
    deltaMock.mockResolvedValue(
      deltaResponse([
        createAction({
          id: 11,
          model: "subscription",
          modelId: "feed-1",
          action: "U",
          data: { view: FeedViewType.Videos, category: "Clips" },
        }),
        createAction({ id: 12, model: "subscription", modelId: "feed-2", action: "D" }),
      ]),
    )

    await syncEngine.pull("interval")

    expect(deltaMock).toHaveBeenCalledWith({ lastSyncId: 10 })
    const state = useSubscriptionStore.getState()
    expect(state.data["feed-1"]?.view).toBe(FeedViewType.Videos)
    expect(state.data["feed-1"]?.category).toBe("Clips")
    expect(state.feedIdByView[FeedViewType.Videos].has("feed-1")).toBe(true)
    expect(state.feedIdByView[FeedViewType.Articles].has("feed-1")).toBe(false)
    expect(state.data["feed-2"]).toBeUndefined()
    expect(subscriptionPatchMock).toHaveBeenCalledWith({
      id: "feed/feed-1",
      view: FeedViewType.Videos,
      category: "Clips",
    })
    expect(subscriptionDeleteMock).toHaveBeenCalledWith(["feed/feed-2"])
    expect(syncEngine.getLastSyncId()).toBe(12)
    expect(invalidateEntriesQueryMock).toHaveBeenCalledTimes(1)
  })

  it("applies collection and read-state changes while pending local marks win", async () => {
    seedCursor(20)
    useEntryStore.setState((state) => ({
      ...state,
      data: {
        entry1: createEntry("entry1", "feed-1"),
        entry2: createEntry("entry2", "feed-1"),
      },
      entryIdSet: new Set(["entry1", "entry2"]),
    }))
    apiContext.provide({
      subscriptions: { get: subscriptionsGetMock },
      reads: { get: readsGetMock, markAsUnread: vi.fn(() => new Promise(() => {})) },
    } as unknown as FollowAPI)
    useEntryStore.setState((state) => ({
      ...state,
      data: { ...state.data, entry2: createEntry("entry2", "feed-1", true) },
    }))
    await unreadSyncService.markEntryAsUnread("entry2")

    deltaMock.mockResolvedValue(
      deltaResponse([
        createAction({
          id: 21,
          model: "collection",
          modelId: "entry1",
          action: "I",
          data: {
            entryId: "entry1",
            feedId: "feed-1",
            view: FeedViewType.Articles,
            createdAt: "2026-09-16T00:00:00.000Z",
          },
        }),
        createAction({
          id: 22,
          model: "timeline",
          action: "U",
          data: { entryIds: ["entry1", "entry2"], read: true, isInbox: false },
        }),
        createAction({ id: 23, model: "collection", modelId: "entry1", action: "D" }),
      ]),
    )

    await syncEngine.pull("interval")

    expect(useEntryStore.getState().data.entry1?.read).toBe(true)
    expect(useEntryStore.getState().data.entry2?.read).toBe(false)
    expect(entryPatchManyMock).toHaveBeenCalledWith({
      entry: { read: true },
      entryIds: ["entry1"],
    })
    expect(collectionUpsertManyMock).toHaveBeenCalledTimes(1)
    expect(collectionDeleteManyMock).toHaveBeenCalledWith(["entry1"])
    expect(useCollectionStore.getState().collections.entry1).toBeUndefined()
    expect(readsGetMock).toHaveBeenCalledTimes(1)
  })

  it("marks feeds dirty and refreshes unread counts on new entries, paging through the delta", async () => {
    seedCursor(30)
    deltaMock
      .mockResolvedValueOnce(
        deltaResponse(
          [
            createAction({
              id: 31,
              model: "timeline",
              modelId: "feed-1",
              action: "N",
              data: {
                feedId: "feed-1",
                count: 3,
                latestPublishedAt: "2026-09-16T00:00:00.000Z",
                from: ["feed"],
              },
            }),
          ],
          { hasMore: true },
        ),
      )
      .mockResolvedValueOnce(deltaResponse([], { lastSyncId: 31 }))

    await syncEngine.pull("interval")

    expect(deltaMock).toHaveBeenCalledTimes(2)
    expect(deltaMock).toHaveBeenLastCalledWith({ lastSyncId: 31 })
    expect(setFeedUnreadDirtyMock).toHaveBeenCalledWith("feed-1")
    expect(readsGetMock).toHaveBeenCalledTimes(1)
    expect(invalidateEntriesQueryMock).not.toHaveBeenCalled()
  })

  it("moves unread counters by what read actions report, without a recount", async () => {
    seedCursor(70)
    unreadActions.upsertManyInSession([
      { id: "feed-1", count: 5 },
      { id: "feed-2", count: 2 },
      { id: "news", count: 1 },
    ])
    useEntryStore.setState((state) => ({
      ...state,
      data: { entry1: createEntry("entry1", "feed-1") },
      entryIdSet: new Set(["entry1"]),
    }))
    deltaMock.mockResolvedValue(
      deltaResponse([
        createAction({
          id: 71,
          data: {
            // entry9 was never loaded here: its feed is only known from `feeds`.
            entryIds: ["entry1", "entry9"],
            read: true,
            isInbox: false,
            feeds: { "feed-1": 1, "feed-2": 1 },
          },
        }),
        createAction({
          id: 72,
          data: { entryIds: ["entry9"], read: false, isInbox: false, feeds: { "feed-2": 1 } },
        }),
        createAction({
          id: 73,
          data: { entryIds: ["mail1"], read: true, isInbox: true, feeds: { news: 4 } },
        }),
      ]),
    )

    await syncEngine.pull("interval")

    expect(useEntryStore.getState().data.entry1?.read).toBe(true)
    expect(useUnreadStore.getState().data).toMatchObject({
      "feed-1": 4,
      "feed-2": 2,
      // Never below zero, even when this client's counter had drifted.
      news: 0,
    })
    expect(readsGetMock).not.toHaveBeenCalled()
    expect(subscriptionsGetMock).not.toHaveBeenCalled()
    expect(unreadUpsertManyMock).toHaveBeenCalledWith([
      { id: "feed-1", count: 4 },
      { id: "feed-2", count: 1 },
    ])
  })

  it("adds new unread entries to the counters and only fetches the head of visible lists", async () => {
    seedCursor(80)
    unreadActions.upsertManyInSession([{ id: "feed-1", count: 1 }])
    useSubscriptionStore.setState((state) => ({
      ...state,
      data: {
        ...state.data,
        "feed-1": {
          feedId: "feed-1",
          type: "feed",
          view: FeedViewType.Videos,
          userId: "user-1",
        } as never,
      },
    }))
    const newEntries = (id: number, unread: number) =>
      createAction({
        id,
        model: "timeline",
        modelId: "feed-1",
        action: "N",
        createdAt: "2026-09-16T08:00:00.000Z",
        data: {
          feedId: "feed-1",
          count: 3,
          unread,
          latestPublishedAt: "2026-09-16T00:00:00.000Z",
          from: ["feed"],
        },
      })

    deltaMock.mockResolvedValueOnce(deltaResponse([newEntries(81, 2)]))
    await syncEngine.pull("interval")

    expect(useUnreadStore.getState().data["feed-1"]).toBe(3)
    expect(setFeedUnreadDirtyMock).toHaveBeenCalledWith("feed-1")
    expect(readsGetMock).not.toHaveBeenCalled()
    // The user may be reading: a background pull leaves the lists alone.
    expect(refreshEntriesHeadMock).not.toHaveBeenCalled()

    deltaMock.mockResolvedValueOnce(deltaResponse([newEntries(82, 0)]))
    await syncEngine.pull("resume")

    expect(useUnreadStore.getState().data["feed-1"]).toBe(3)
    expect(refreshEntriesHeadMock).toHaveBeenCalledWith({
      views: expect.arrayContaining([FeedViewType.Videos, FeedViewType.All]),
      since: Date.parse("2026-09-16T08:00:00.000Z"),
    })
    expect(invalidateEntriesQueryMock).not.toHaveBeenCalled()
    expect(readsGetMock).not.toHaveBeenCalled()
  })

  it("takes full snapshots again only when a calibration is due", async () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    seedCursor(90, twoHoursAgo)
    readsGetMock.mockResolvedValue({ data: { "feed-1": 7 } })
    deltaMock.mockResolvedValue(deltaResponse([], { lastSyncId: 90 }))

    await syncEngine.pull("interval")

    // Unread entries age out of the retention window without an action: recount hourly.
    expect(readsGetMock).toHaveBeenCalledTimes(1)
    expect(useUnreadStore.getState().data["feed-1"]).toBe(7)
    // Feed metadata is refreshed daily, so two hours are not enough.
    expect(subscriptionsGetMock).not.toHaveBeenCalled()
    expect(Number(syncMetaStore.get("unreadCalibratedAt"))).toBeGreaterThan(twoHoursAgo)

    await syncEngine.pull("interval")
    expect(readsGetMock).toHaveBeenCalledTimes(1)

    seedCursor(90, Date.now() - 25 * 60 * 60 * 1000)
    syncEngine.clearInSession()
    await syncEngine.pull("interval")
    expect(readsGetMock).toHaveBeenCalledTimes(2)
    expect(subscriptionsGetMock).toHaveBeenCalledTimes(1)
  })

  it("does not add new-entry hints a recount already counted, even when they arrive later", async () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    seedCursor(200, twoHoursAgo)
    // The crawler logged four new entries at 201, but this poll is still answered from a
    // head published before that, so the hint is not delivered yet.
    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 200 }))
    // The recount that follows already sees the four entries.
    stateMock.mockResolvedValue({ code: 0, data: { lastSyncId: 201 } })
    readsGetMock.mockResolvedValue({ data: { "feed-1": 4 } })

    await syncEngine.pull("interval")

    expect(useUnreadStore.getState().data["feed-1"]).toBe(4)
    expect(syncMetaStore.get("unreadSnapshotSyncId")).toBe("201")

    // The user reads one of them; the next poll delivers the hint and the flip together.
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 201,
          action: "N",
          modelId: "feed-1",
          data: {
            feedId: "feed-1",
            count: 4,
            unread: 4,
            latestPublishedAt: "2026-09-18T14:31:00.000Z",
            from: ["feed"],
          },
        }),
        createAction({
          id: 202,
          data: { entryIds: ["entry1"], read: true, isInbox: false, feeds: { "feed-1": 1 } },
        }),
      ]),
    )
    await syncEngine.pull("interval")

    // Four minus one, not four plus four minus one.
    expect(useUnreadStore.getState().data["feed-1"]).toBe(3)
    expect(setFeedUnreadDirtyMock).toHaveBeenCalledWith("feed-1")
  })

  it("takes the snapshot id from the recount answer and keeps it across restarts", async () => {
    seedCursor(300, Date.now() - 2 * 60 * 60 * 1000)
    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 300 }))
    stateMock.mockResolvedValue({ code: 0, data: { lastSyncId: 301 } })
    // The server names the id its counts reflect; it beats the state read before.
    readsGetMock.mockResolvedValue({ data: { "feed-1": 2 }, lastSyncId: 305 })

    await syncEngine.pull("interval")
    expect(syncMetaStore.get("unreadSnapshotSyncId")).toBe("305")

    // A restart loads the id again: 305 is inside the snapshot, 306 is not.
    syncEngine.clearInSession()
    seedCursor(300)
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 305,
          action: "N",
          modelId: "feed-1",
          data: {
            feedId: "feed-1",
            count: 2,
            unread: 2,
            latestPublishedAt: "2026-09-18T00:00:00.000Z",
            from: ["feed"],
          },
        }),
        createAction({
          id: 306,
          action: "N",
          modelId: "feed-1",
          data: {
            feedId: "feed-1",
            count: 1,
            unread: 1,
            latestPublishedAt: "2026-09-18T00:00:00.000Z",
            from: ["feed"],
          },
        }),
      ]),
    )
    await syncEngine.pull("interval")

    expect(useUnreadStore.getState().data["feed-1"]).toBe(3)
    expect(readsGetMock).toHaveBeenCalledTimes(1)
  })

  it("still flips read state and settles transactions for actions inside the snapshot", async () => {
    seedCursor(400, Date.now() - 2 * 60 * 60 * 1000)
    useEntryStore.setState((state) => ({
      ...state,
      data: { entry1: createEntry("entry1", "feed-1") },
      entryIdSet: new Set(["entry1"]),
    }))
    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 400 }))
    stateMock.mockResolvedValue({ code: 0, data: { lastSyncId: 400 } })
    // Another device read entry1 at 401, and the recount already reflects that.
    readsGetMock.mockResolvedValue({ data: { "feed-1": 1 }, lastSyncId: 401 })
    await syncEngine.pull("interval")
    expect(useUnreadStore.getState().data["feed-1"]).toBe(1)

    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 401,
          data: { entryIds: ["entry1"], read: true, isInbox: false, feeds: { "feed-1": 1 } },
        }),
      ]),
    )
    await syncEngine.pull("interval")

    expect(useEntryStore.getState().data.entry1?.read).toBe(true)
    expect(entryPatchManyMock).toHaveBeenCalledWith({ entry: { read: true }, entryIds: ["entry1"] })
    // The counter was not moved twice.
    expect(useUnreadStore.getState().data["feed-1"]).toBe(1)
  })

  it("lets callers rely on the local snapshot once a cursor exists", async () => {
    seedCursor(100)
    deltaMock.mockResolvedValue(deltaResponse([], { lastSyncId: 100 }))

    expect(await syncEngine.ensureSynced()).toBe(true)
    // A second caller right after shares the pull that just finished.
    expect(await syncEngine.ensureSynced()).toBe(true)

    expect(deltaMock).toHaveBeenCalledTimes(1)
    expect(subscriptionsGetMock).not.toHaveBeenCalled()
    expect(readsGetMock).not.toHaveBeenCalled()
  })

  it("keeps answering from the local snapshot when a pull fails, and declines without sync endpoints", async () => {
    seedCursor(110)
    deltaMock.mockRejectedValueOnce(new Error("offline"))
    expect(await syncEngine.ensureSynced()).toBe(true)

    syncEngine.clearInSession()
    syncMetaStore.clear()
    stateMock.mockRejectedValue(new FollowAPIError("not found", 404))
    expect(await syncEngine.ensureSynced()).toBe(false)
    expect(await syncEngine.catchUp(0)).toBe(false)
  })

  it("drops the prediction of a local mark once the change log reports the real effect", async () => {
    seedCursor(120)
    deltaMock.mockResolvedValue(deltaResponse([], { lastSyncId: 120 }))
    await syncEngine.pull("interval")

    unreadActions.upsertManyInSession([{ id: "feed-1", count: 5 }])
    useEntryStore.setState((state) => ({
      ...state,
      data: { entry1: createEntry("entry1", "feed-1") },
      entryIdSet: new Set(["entry1"]),
    }))
    // Another device had marked the entry already, so the server flips nothing and answers
    // with the id of that device's action.
    apiContext.provide({
      subscriptions: { get: subscriptionsGetMock },
      reads: { get: readsGetMock, markAsRead: vi.fn(async () => ({ code: 0, lastSyncId: 121 })) },
    } as unknown as FollowAPI)

    await unreadSyncService.markEntriesAsRead(["entry1"])
    expect(useUnreadStore.getState().data["feed-1"]).toBe(4)
    await transactionQueue.flush()
    // Acknowledged, but the change log has not been read up to 121 yet.
    expect(useUnreadStore.getState().data["feed-1"]).toBe(4)

    deltaMock.mockResolvedValue(
      deltaResponse([
        createAction({
          id: 121,
          data: { entryIds: ["entry1"], read: true, isInbox: false, feeds: { "feed-1": 1 } },
        }),
      ]),
    )
    await syncEngine.pull("ack")

    // One flip in total, not the other device's plus this client's prediction.
    expect(useUnreadStore.getState().data["feed-1"]).toBe(4)
    expect(unreadUpsertManyMock).toHaveBeenLastCalledWith([{ id: "feed-1", count: 4 }])
    expect(readsGetMock).not.toHaveBeenCalled()
  })

  it("bootstraps a registered model once and hands it its actions", async () => {
    seedCursor(130)
    const bootstrap = vi.fn(async () => {})
    const apply = vi.fn()
    const unregister = registerSyncModel("widget", { bootstrap, apply })

    const widgetAction = createAction({ id: 131, model: "widget", modelId: "w1", data: { n: 1 } })
    deltaMock.mockResolvedValueOnce(deltaResponse([widgetAction]))
    await syncEngine.pull("interval")

    expect(apply).toHaveBeenCalledWith(widgetAction)
    // The account had a cursor but never loaded this model: it is loaded in full once.
    expect(bootstrap).toHaveBeenCalledTimes(1)
    expect(syncMetaStore.get("bootstrapped:widget")).toBe("1")

    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 131 }))
    await syncEngine.pull("interval")
    expect(bootstrap).toHaveBeenCalledTimes(1)

    unregister()
  })

  it("loads a model in full again after its actions went by without a handler", async () => {
    seedCursor(140)
    syncMetaStore.set("bootstrapped:widget", "1")

    deltaMock.mockResolvedValueOnce(
      deltaResponse([createAction({ id: 141, model: "widget", modelId: "w1" })]),
    )
    await syncEngine.pull("interval")
    expect(syncMetaStore.has("bootstrapped:widget")).toBe(false)

    const bootstrap = vi.fn(async () => {})
    const unregister = registerSyncModel("widget", { bootstrap, apply: vi.fn() })
    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 141 }))
    await syncEngine.pull("interval")

    expect(bootstrap).toHaveBeenCalledTimes(1)
    expect(syncMetaStore.get("bootstrapped:widget")).toBe("1")
    unregister()
  })

  it("loads registered models during the first bootstrap and retries a failed one", async () => {
    const bootstrap = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue()
    const unregister = registerSyncModel("widget", { bootstrap, apply: vi.fn() })
    stateMock.mockResolvedValue({ code: 0, data: { lastSyncId: 7 } })

    await syncEngine.pull("launch")
    expect(bootstrap).toHaveBeenCalledTimes(1)
    expect(syncMetaStore.has("bootstrapped:widget")).toBe(false)
    expect(syncEngine.getLastSyncId()).toBe(7)

    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 7 }))
    await syncEngine.pull("interval")
    expect(bootstrap).toHaveBeenCalledTimes(2)
    expect(syncMetaStore.get("bootstrapped:widget")).toBe("1")
    unregister()
  })

  it("brings lists up to date on the next return for entries that arrived while reading", async () => {
    seedCursor(150)
    useSubscriptionStore.setState((state) => ({
      ...state,
      data: {
        ...state.data,
        "feed-1": {
          feedId: "feed-1",
          type: "feed",
          view: FeedViewType.Articles,
          userId: "user-1",
        } as never,
      },
    }))
    deltaMock.mockResolvedValueOnce(
      deltaResponse([
        createAction({
          id: 151,
          model: "timeline",
          modelId: "feed-1",
          action: "N",
          createdAt: "2026-09-18T09:00:00.000Z",
          data: {
            feedId: "feed-1",
            count: 1,
            unread: 1,
            latestPublishedAt: "2026-09-18T09:00:00.000Z",
            from: ["feed"],
          },
        }),
      ]),
    )
    await syncEngine.pull("interval")
    expect(refreshEntriesHeadMock).not.toHaveBeenCalled()

    // Nothing new in the log, but the entries from before are still owed to the lists.
    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 151 }))
    await syncEngine.pull("resume")

    expect(refreshEntriesHeadMock).toHaveBeenCalledTimes(1)
    expect(refreshEntriesHeadMock).toHaveBeenCalledWith({
      views: expect.arrayContaining([FeedViewType.Articles, FeedViewType.All]),
      since: Date.parse("2026-09-18T09:00:00.000Z"),
    })

    deltaMock.mockResolvedValueOnce(deltaResponse([], { lastSyncId: 151 }))
    syncEngine.clearInSession()
    seedCursor(151)
    await syncEngine.pull("resume")
    expect(refreshEntriesHeadMock).toHaveBeenCalledTimes(1)
  })

  it("bootstraps again when the server asks for a reset", async () => {
    seedCursor(5)
    deltaMock.mockResolvedValue(deltaResponse([], { reset: true, lastSyncId: 5 }))
    stateMock.mockResolvedValue({ code: 0, data: { lastSyncId: 99 } })

    await syncEngine.pull("interval")

    expect(stateMock).toHaveBeenCalledTimes(1)
    expect(subscriptionsGetMock).toHaveBeenCalledTimes(1)
    expect(syncEngine.getLastSyncId()).toBe(99)
  })

  it("falls back to the full refetch behaviour when the server has no sync endpoints", async () => {
    stateMock.mockRejectedValue(new FollowAPIError("not found", 404))

    await syncEngine.pull("launch")
    await syncEngine.pull("interval")

    expect(stateMock).toHaveBeenCalledTimes(1)
    expect(syncEngine.isAvailable()).toBe(false)
    expect(isSyncEngineActive()).toBe(false)
    expect(subscriptionsGetMock).not.toHaveBeenCalled()
  })
})
