import { FeedViewType } from "@follow/constants"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import type { FollowAPI } from "../../types"
import { useEntryStore } from "../entry/store"
import type { EntryModel } from "../entry/types"
import { unreadSyncService, useUnreadStore } from "./store"

const { entryPatchManyMock, unreadUpsertManyMock } = vi.hoisted(() => ({
  entryPatchManyMock: vi.fn(),
  unreadUpsertManyMock: vi.fn(),
}))

vi.mock("@follow/database/services/entry", () => ({
  EntryService: {
    patchMany: entryPatchManyMock,
  },
}))

vi.mock("@follow/database/services/unread", () => ({
  UnreadService: {
    getUnreadAll: vi.fn(),
    reset: vi.fn(),
    upsertMany: unreadUpsertManyMock,
  },
}))

const createEntry = (id: string, feedId: string, read = false): EntryModel => ({
  id,
  guid: `${id}-guid`,
  insertedAt: new Date("2026-01-01T00:00:00.000Z"),
  publishedAt: new Date("2026-01-01T00:00:00.000Z"),
  feedId,
  read,
})

describe("unreadSyncService", () => {
  const markAsReadMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

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
    useUnreadStore.setState({ data: {} })
    apiContext.provide({
      reads: {
        markAsRead: markAsReadMock,
      },
    } as unknown as FollowAPI)
  })

  it("marks multiple feed entries as read with one request and one local patch", async () => {
    const entries = {
      entry1: createEntry("entry1", "feed1"),
      entry2: createEntry("entry2", "feed1"),
    }
    useEntryStore.setState((state) => ({
      ...state,
      data: entries,
      entryIdSet: new Set(Object.keys(entries)),
    }))
    useUnreadStore.setState({ data: { feed1: 2 } })
    markAsReadMock.mockResolvedValue({ data: null })

    await unreadSyncService.markEntriesAsRead(["entry1", "entry2"])

    expect(markAsReadMock).toHaveBeenCalledTimes(1)
    expect(markAsReadMock).toHaveBeenCalledWith({
      entryIds: ["entry1", "entry2"],
      isInbox: false,
    })
    expect(entryPatchManyMock).toHaveBeenCalledTimes(1)
    expect(entryPatchManyMock).toHaveBeenCalledWith({
      entry: { read: true },
      entryIds: ["entry1", "entry2"],
    })
    expect(useEntryStore.getState().data.entry1?.read).toBe(true)
    expect(useEntryStore.getState().data.entry2?.read).toBe(true)
    expect(useUnreadStore.getState().data.feed1).toBe(0)
  })

  it("queues rapid read marks into one batched request", async () => {
    vi.useFakeTimers()

    try {
      const entries = {
        entry1: createEntry("entry1", "feed1"),
        entry2: createEntry("entry2", "feed1"),
      }
      useEntryStore.setState((state) => ({
        ...state,
        data: entries,
        entryIdSet: new Set(Object.keys(entries)),
      }))
      useUnreadStore.setState({ data: { feed1: 2 } })
      markAsReadMock.mockResolvedValue({ data: null })

      const firstFlush = unreadSyncService.queueEntriesAsRead(["entry1"])
      const secondFlush = unreadSyncService.queueEntriesAsRead(["entry2"])

      expect(markAsReadMock).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(100)
      await Promise.all([firstFlush, secondFlush])

      expect(markAsReadMock).toHaveBeenCalledTimes(1)
      expect(markAsReadMock).toHaveBeenCalledWith({
        entryIds: ["entry1", "entry2"],
        isInbox: false,
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
