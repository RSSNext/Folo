import { FeedViewType } from "@follow/constants"
import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext, queryClientContext } from "../../context"
import type { FollowAPI } from "../../types"
import { useUnreadStore } from "../unread/store"
import { listSyncServices, useListStore } from "./store"
import type { ListModel } from "./types"

const mocks = vi.hoisted(() => ({
  removeFeed: vi.fn(),
  readsGet: vi.fn(),
}))

vi.mock("@follow/database/services/list", () => ({
  ListService: { upsertMany: vi.fn(async () => {}), deleteList: vi.fn(async () => {}) },
}))

vi.mock("@follow/database/services/unread", () => ({
  UnreadService: { upsertMany: vi.fn(async () => {}), reset: vi.fn(async () => {}) },
}))

const list = {
  id: "list-1",
  type: "list",
  title: "Reading",
  view: FeedViewType.Articles,
  feedIds: ["feed-1", "feed-2"],
  userId: "user-1",
  ownerUserId: "user-1",
  fee: 0,
} as ListModel

describe("listSyncServices.removeFeedFromFeedList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClientContext.provide(new QueryClient())
    mocks.removeFeed.mockResolvedValue({ code: 0 })
    mocks.readsGet.mockResolvedValue({ code: 0, data: { "feed-1": 3 } })
    apiContext.provide({
      lists: { removeFeed: mocks.removeFeed },
      reads: { get: mocks.readsGet },
    } as unknown as FollowAPI)
    useListStore.setState({ lists: { [list.id]: list }, listIds: [list.id] })
    useUnreadStore.setState({ data: { "feed-1": 3, "feed-2": 5 } })
  })

  it("counts the unread entries again, as the server took the feed's out of the timeline", async () => {
    await listSyncServices.removeFeedFromFeedList({ listId: list.id, feedId: "feed-2" })

    expect(mocks.removeFeed).toHaveBeenCalledWith({ listId: list.id, feedId: "feed-2" })
    expect(useListStore.getState().lists[list.id]?.feedIds).toEqual(["feed-1"])
    await vi.waitFor(() => expect(mocks.readsGet).toHaveBeenCalledTimes(1))
  })
})
