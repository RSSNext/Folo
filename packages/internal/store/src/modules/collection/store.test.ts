import { FeedViewType } from "@follow/constants"
import { FollowAPIError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import { clearAccountInSession, startSessionCheck } from "../../sync/account"
import { transactionQueue } from "../../sync/transaction-queue"
import type { FollowAPI } from "../../types"
import { useEntryStore } from "../entry/store"
import type { EntryModel } from "../entry/types"
import { collectionActions, collectionSyncService, useCollectionStore } from "./store"

const { collectionUpsertManyMock, collectionDeleteManyMock } = vi.hoisted(() => ({
  collectionUpsertManyMock: vi.fn(async () => {}),
  collectionDeleteManyMock: vi.fn(async () => {}),
}))

vi.mock("@follow/database/services/collection", () => ({
  CollectionService: {
    getCollectionAll: vi.fn(),
    reset: vi.fn(),
    upsertMany: collectionUpsertManyMock,
    deleteMany: collectionDeleteManyMock,
  },
}))

vi.mock("@follow/database/services/sync-meta", () => ({
  SyncMetaService: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
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

vi.mock("../entry/hooks", () => ({
  invalidateEntriesQuery: vi.fn(),
}))

const createEntry = (id: string, feedId: string): EntryModel => ({
  id,
  guid: `${id}-guid`,
  insertedAt: new Date("2026-01-01T00:00:00.000Z"),
  publishedAt: new Date("2026-01-01T00:00:00.000Z"),
  feedId,
  read: false,
})

describe("collectionSyncService", () => {
  const collectionPostMock = vi.fn()
  const collectionDeleteMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    transactionQueue.clearInSession()
    // Signed in as the account the local data belongs to.
    clearAccountInSession()
    startSessionCheck().confirm("user-1")
    useCollectionStore.setState({ collections: {} })
    useEntryStore.setState((state) => ({
      ...state,
      data: { entry1: createEntry("entry1", "feed1") },
      entryIdSet: new Set(["entry1"]),
    }))
    apiContext.provide({
      collections: {
        post: collectionPostMock,
        delete: collectionDeleteMock,
      },
    } as unknown as FollowAPI)
  })

  afterEach(() => {
    transactionQueue.clearInSession()
    vi.useRealTimers()
  })

  it("keeps a pending star when a stale entry fetch says it is not collected", async () => {
    collectionPostMock.mockReturnValue(new Promise(() => {}))

    await collectionSyncService.starEntry({ entryId: "entry1", view: FeedViewType.Articles })
    expect(useCollectionStore.getState().collections.entry1).toBeDefined()

    await collectionActions.reconcileFromRemote({
      collections: [],
      entryIdsNotInCollections: ["entry1"],
      reset: true,
    })

    expect(useCollectionStore.getState().collections.entry1).toBeDefined()
    expect(collectionDeleteManyMock).not.toHaveBeenCalled()
  })

  it("keeps a pending unstar when a stale fetch still lists the collection", async () => {
    useCollectionStore.setState({
      collections: {
        entry1: {
          entryId: "entry1",
          feedId: "feed1",
          view: FeedViewType.Articles,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })
    collectionDeleteMock.mockReturnValue(new Promise(() => {}))

    await collectionSyncService.unstarEntry({ entryId: "entry1" })
    expect(useCollectionStore.getState().collections.entry1).toBeUndefined()

    await collectionActions.reconcileFromRemote({
      collections: [
        {
          entryId: "entry1",
          feedId: "feed1",
          view: FeedViewType.Articles,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      entryIdsNotInCollections: [],
    })

    expect(useCollectionStore.getState().collections.entry1).toBeUndefined()
  })

  it("persists the star once the server acknowledges it", async () => {
    collectionPostMock.mockResolvedValue({ code: 0 })

    await collectionSyncService.starEntry({ entryId: "entry1", view: FeedViewType.Articles })
    expect(collectionUpsertManyMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(collectionPostMock).toHaveBeenCalledWith({
      entryId: "entry1",
      view: FeedViewType.Articles,
    })
    expect(collectionUpsertManyMock).toHaveBeenCalledTimes(1)
  })

  it("removes the optimistic star when the server rejects it", async () => {
    collectionPostMock.mockRejectedValue(new FollowAPIError("not found", 404))

    await collectionSyncService.starEntry({ entryId: "entry1", view: FeedViewType.Articles })
    expect(useCollectionStore.getState().collections.entry1).toBeDefined()

    await vi.advanceTimersByTimeAsync(100)
    await transactionQueue.whenIdle()

    expect(useCollectionStore.getState().collections.entry1).toBeUndefined()
    expect(collectionUpsertManyMock).not.toHaveBeenCalled()
  })
})
