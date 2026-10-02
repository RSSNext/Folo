import { FeedViewType } from "@follow/constants"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useEntryStore } from "../entry/store"
import type { EntryModel } from "../entry/types"
import { useListStore } from "../list/store"
import { useSubscriptionStore } from "../subscription/store"
import { getUnreadScopeIds } from "./getters"
import { hasUnreadCounterAboveList } from "./hooks"
import { unreadActions } from "./store"

vi.mock("@follow/database/services/entry", () => ({ EntryService: { patchMany: vi.fn() } }))
vi.mock("@follow/database/services/unread", () => ({
  UnreadService: { getUnreadAll: vi.fn(), reset: vi.fn(), upsertMany: vi.fn() },
}))
vi.mock("@follow/database/services/sync-transaction", () => ({
  SyncTransactionService: {
    insert: vi.fn(async () => {}),
    deleteMany: vi.fn(async () => {}),
    getAll: vi.fn(async () => []),
    reset: vi.fn(async () => {}),
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

const subscription = (feedId: string, extra: Record<string, unknown> = {}) => ({
  feedId,
  view: FeedViewType.Articles,
  ...extra,
})

describe("hasUnreadCounterAboveList", () => {
  beforeEach(() => {
    const entries = {
      entry1: createEntry("entry1", "feed1"),
      entry2: createEntry("entry2", "feed1", true),
      entry3: createEntry("entry3", "feed2"),
    }
    useEntryStore.setState((state) => ({
      ...state,
      data: entries,
      entryIdSet: new Set(Object.keys(entries)),
    }))
    useSubscriptionStore.setState((state) => ({
      ...state,
      data: {
        feed1: subscription("feed1"),
        feed2: subscription("feed2"),
        feed3: subscription("feed3", { isPrivate: true }),
        feed4: subscription("feed4", { hideFromTimeline: true }),
      } as never,
      feedIdByView: {
        ...state.feedIdByView,
        [FeedViewType.Articles]: new Set(["feed1", "feed2", "feed3", "feed4"]),
        [FeedViewType.SocialMedia]: new Set(),
      },
      listIdByView: { ...state.listIdByView, [FeedViewType.Articles]: new Set() },
    }))
    useListStore.setState({
      lists: { list1: { id: "list1", feedIds: ["feed1", "feed2"] } as never },
      listIds: ["list1"],
    })
    unreadActions.upsertManyInSession(
      [
        { id: "feed1", count: 1 },
        { id: "feed2", count: 1 },
        { id: "feed3", count: 5 },
        { id: "feed4", count: 5 },
      ],
      { reset: true },
    )
  })

  it("agrees with a list that shows every unread entry of its feed", () => {
    expect(hasUnreadCounterAboveList(["entry1", "entry2"], { feedId: "feed1" })).toBe(false)
  })

  it("notices a counter above what a complete list shows", () => {
    unreadActions.upsertManyInSession([{ id: "feed1", count: 4 }])
    expect(hasUnreadCounterAboveList(["entry1", "entry2"], { feedId: "feed1" })).toBe(true)
    // Read entries on screen do not count towards the list.
    expect(hasUnreadCounterAboveList(["entry2"], { feedId: "feed1" })).toBe(true)
  })

  it("sums a folder, a list and a view the way the timeline is filtered", () => {
    expect(getUnreadScopeIds({ feedId: "feed1,feed2" })).toEqual(["feed1", "feed2"])
    expect(getUnreadScopeIds({ listId: "list1" })).toEqual(["feed1", "feed2"])
    expect(getUnreadScopeIds({ feedIdList: ["feed2"] })).toEqual(["feed2"])
    expect(getUnreadScopeIds({ inboxId: "inbox-a" })).toEqual(["inbox-a"])
    // Hidden subscriptions never reach the timeline; private ones only when they are not hidden.
    expect(getUnreadScopeIds({ view: FeedViewType.Articles })).toEqual(["feed1", "feed2", "feed3"])
    expect(getUnreadScopeIds({ view: FeedViewType.Articles, excludePrivate: true })).toEqual([
      "feed1",
      "feed2",
    ])
    expect(getUnreadScopeIds({ view: FeedViewType.All, excludePrivate: true })).toEqual([
      "feed1",
      "feed2",
    ])

    expect(
      hasUnreadCounterAboveList(["entry1", "entry3"], {
        view: FeedViewType.Articles,
        excludePrivate: true,
      }),
    ).toBe(false)
    expect(
      hasUnreadCounterAboveList(["entry1"], { view: FeedViewType.Articles, excludePrivate: true }),
    ).toBe(true)
  })

  it("has no opinion on lists without a counter", () => {
    expect(getUnreadScopeIds({ isCollection: true })).toBeUndefined()
    expect(getUnreadScopeIds({ feedId: "collections" })).toBeUndefined()
    expect(getUnreadScopeIds({})).toBeUndefined()
    expect(hasUnreadCounterAboveList([], { isCollection: true })).toBe(false)
  })
})
