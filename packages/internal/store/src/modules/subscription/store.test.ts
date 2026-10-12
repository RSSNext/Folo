import { FeedViewType } from "@follow/constants"
import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { apiContext, queryClientContext } from "../../context"
import type { FollowAPI } from "../../types"
import { useListStore } from "../list/store"
import type { ListModel } from "../list/types"
import { useUnreadStore } from "../unread/store"
import { getSortedGroupedSubscriptionSelector } from "./getter"
import {
  getConfirmedSubscriptionChange,
  subscriptionActions,
  subscriptionSyncService,
  useSubscriptionStore,
} from "./store"
import type { SubscriptionModel } from "./types"

const mocks = vi.hoisted(() => ({
  upsertSubscriptionRows: vi.fn(),
  deleteSubscriptions: vi.fn(),
  deleteSubscriptionRows: vi.fn(),
  unreadUpsertMany: vi.fn(),
  batchUpdate: vi.fn(),
  update: vi.fn(),
  patch: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  patchMany: vi.fn(),
}))

vi.mock("@follow/database/services/unread", () => ({
  UnreadService: {
    upsertMany: mocks.unreadUpsertMany,
  },
}))

vi.mock("@follow/database/services/subscription", () => ({
  SubscriptionService: {
    upsertMany: mocks.upsertSubscriptionRows,
    delete: mocks.deleteSubscriptionRows,
    patch: mocks.patch,
    patchMany: mocks.patchMany,
  },
}))

const createSubscription = (
  feedId: string,
  view: FeedViewType,
  category: string | null,
): SubscriptionModel => ({
  feedId,
  listId: null,
  inboxId: null,
  userId: "user",
  view,
  isPrivate: false,
  hideFromTimeline: null,
  title: null,
  category,
  createdAt: new Date(0).toISOString(),
  type: "feed",
})

const seed = (subscriptions: SubscriptionModel[]) => {
  const state = useSubscriptionStore.getState()
  const feedIdByView = Object.fromEntries(
    Object.keys(state.feedIdByView).map((view) => [view, new Set<string>()]),
  ) as Record<FeedViewType, Set<string>>
  const categories = Object.fromEntries(
    Object.keys(state.categories).map((view) => [view, new Set<string>()]),
  ) as Record<FeedViewType, Set<string>>

  for (const subscription of subscriptions) {
    feedIdByView[subscription.view].add(subscription.feedId!)
    feedIdByView[FeedViewType.All].add(subscription.feedId!)
    if (subscription.category) {
      categories[subscription.view].add(subscription.category)
      categories[FeedViewType.All].add(subscription.category)
    }
  }

  useSubscriptionStore.setState({
    data: Object.fromEntries(subscriptions.map((s) => [s.feedId!, s])),
    feedIdByView,
    categories,
  })
}

describe("subscriptionSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.batchUpdate.mockResolvedValue({})
    mocks.updateCategory.mockResolvedValue({})
    mocks.deleteCategory.mockResolvedValue({})
    mocks.patchMany.mockResolvedValue(undefined)
    mocks.update.mockResolvedValue({})
    mocks.deleteSubscriptions.mockResolvedValue({})
    mocks.deleteSubscriptionRows.mockResolvedValue(undefined)
    mocks.upsertSubscriptionRows.mockResolvedValue(undefined)
    mocks.unreadUpsertMany.mockResolvedValue(undefined)
    mocks.patch.mockResolvedValue(undefined)
    queryClientContext.provide(new QueryClient())
    apiContext.provide({
      subscriptions: {
        batchUpdate: mocks.batchUpdate,
        delete: mocks.deleteSubscriptions,
        update: mocks.update,
      },
      categories: { update: mocks.updateCategory, delete: mocks.deleteCategory },
    } as unknown as FollowAPI)
  })

  test("takes feeds out of their category when the category is null", async () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "Tech"),
      createSubscription("b", FeedViewType.Articles, "News"),
      createSubscription("c", FeedViewType.Articles, "News"),
    ])

    await subscriptionSyncService.batchUpdateSubscription({
      feedIds: ["a", "b"],
      category: null,
      view: FeedViewType.Articles,
    })

    const state = useSubscriptionStore.getState()
    expect(state.data.a!.category).toBeNull()
    expect(state.data.b!.category).toBeNull()
    expect(state.data.c!.category).toBe("News")
    expect([...state.categories[FeedViewType.Articles]]).toEqual(["News"])
  })

  test("keeps the category when only the view changes", async () => {
    seed([createSubscription("a", FeedViewType.Articles, "Tech")])

    await subscriptionSyncService.batchUpdateSubscription({
      feedIds: ["a"],
      view: FeedViewType.Pictures,
    })

    const state = useSubscriptionStore.getState()
    expect(state.data.a!.view).toBe(FeedViewType.Pictures)
    expect(state.data.a!.category).toBe("Tech")
  })

  test("renames a folder of the All view in every view it spans", async () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "Tech"),
      createSubscription("b", FeedViewType.Pictures, "Tech"),
    ])

    await subscriptionSyncService.renameCategory({
      lastCategory: "Tech",
      newCategory: "Science",
      view: FeedViewType.All,
    })

    const state = useSubscriptionStore.getState()
    expect(state.data.a!.category).toBe("Science")
    expect(state.data.b!.category).toBe("Science")
    expect([...state.categories[FeedViewType.Articles]]).toEqual(["Science"])
    expect([...state.categories[FeedViewType.Pictures]]).toEqual(["Science"])
    expect(mocks.updateCategory).toHaveBeenCalledWith({
      feedIdList: ["a", "b"],
      category: "Science",
    })
  })

  test("moves a list to its new view when the list is edited", async () => {
    const list: SubscriptionModel = {
      ...createSubscription("", FeedViewType.Articles, null),
      feedId: null,
      listId: "list1",
      type: "list",
    }
    const state = useSubscriptionStore.getState()
    useSubscriptionStore.setState({
      data: { list1: list },
      listIdByView: {
        ...state.listIdByView,
        [FeedViewType.Articles]: new Set(["list1"]),
        [FeedViewType.Pictures]: new Set(),
      },
    })

    await subscriptionSyncService.edit({ ...list, view: FeedViewType.Pictures })

    const { listIdByView } = useSubscriptionStore.getState()
    expect(listIdByView[FeedViewType.Articles].has("list1")).toBe(false)
    expect(listIdByView[FeedViewType.Pictures].has("list1")).toBe(true)
  })

  test("clears the unread counts of feeds followed only through an unfollowed list", async () => {
    const list: SubscriptionModel = {
      ...createSubscription("", FeedViewType.Articles, null),
      feedId: null,
      listId: "list1",
      type: "list",
    }
    seed([createSubscription("direct", FeedViewType.Articles, null)])
    useSubscriptionStore.setState((state) => ({ data: { ...state.data, list1: list } }))
    useListStore.setState({
      lists: { list1: { id: "list1", feedIds: ["direct", "listOnly"] } as ListModel },
    })
    useUnreadStore.setState({ data: { direct: 3, listOnly: 5 } })

    await subscriptionSyncService.unsubscribe("list1")
    await vi.waitFor(() => expect(useUnreadStore.getState().data.listOnly).toBe(0))
    expect(useUnreadStore.getState().data.direct).toBe(3)
  })

  test("unfollows the selected feeds together and each selected list on its own", async () => {
    const createList = (listId: string): SubscriptionModel => ({
      ...createSubscription("", FeedViewType.Articles, null),
      feedId: null,
      listId,
      type: "list",
    })
    seed([
      createSubscription("feed1", FeedViewType.Articles, null),
      createSubscription("feed2", FeedViewType.Articles, null),
    ])
    useSubscriptionStore.setState((state) => ({
      data: { ...state.data, list1: createList("list1"), list2: createList("list2") },
      listIdByView: {
        ...state.listIdByView,
        [FeedViewType.All]: new Set(["list1", "list2"]),
        [FeedViewType.Articles]: new Set(["list1", "list2"]),
      },
    }))
    let syncId = 40
    mocks.deleteSubscriptions.mockImplementation(async () => ({ code: 0, lastSyncId: ++syncId }))

    await subscriptionSyncService.unsubscribe(["feed1", "list1", "feed2", "list2"])

    expect(mocks.deleteSubscriptions.mock.calls).toEqual([
      [{ feedIdList: ["feed1", "feed2"] }],
      [{ listId: "list1" }],
      [{ listId: "list2" }],
    ])
    const state = useSubscriptionStore.getState()
    expect(Object.keys(state.data)).toEqual([])
    expect([...state.listIdByView[FeedViewType.Articles]]).toEqual([])
    expect(mocks.deleteSubscriptionRows).toHaveBeenCalledWith([
      "feed/feed1",
      "list/list1",
      "feed/feed2",
      "list/list2",
    ])
    // Each unfollow stays confirmed until the change log reaches its own sync id
    expect(getConfirmedSubscriptionChange("feed2")).toEqual({ subscription: null, syncId: 41 })
    expect(getConfirmedSubscriptionChange("list1")).toEqual({ subscription: null, syncId: 42 })
    expect(getConfirmedSubscriptionChange("list2")).toEqual({ subscription: null, syncId: 43 })
  })

  test("keeps only the subscriptions whose unfollow failed", async () => {
    const list: SubscriptionModel = {
      ...createSubscription("", FeedViewType.Articles, null),
      feedId: null,
      listId: "failingList",
      type: "list",
    }
    seed([createSubscription("leaving", FeedViewType.Articles, null)])
    useSubscriptionStore.setState((state) => ({
      data: { ...state.data, failingList: list },
      listIdByView: {
        ...state.listIdByView,
        [FeedViewType.All]: new Set(["failingList"]),
        [FeedViewType.Articles]: new Set(["failingList"]),
      },
    }))
    const error = new Error("Network error")
    mocks.deleteSubscriptions.mockImplementation(async (body: { listId?: string }) => {
      if (body.listId) throw error
      return { code: 0 }
    })

    await expect(subscriptionSyncService.unsubscribe(["leaving", "failingList"])).rejects.toBe(
      error,
    )

    const state = useSubscriptionStore.getState()
    expect(Object.keys(state.data)).toEqual(["failingList"])
    expect(state.listIdByView[FeedViewType.Articles].has("failingList")).toBe(true)
    expect(state.feedIdByView[FeedViewType.Articles].has("leaving")).toBe(false)
    expect(mocks.deleteSubscriptionRows).toHaveBeenCalledWith(["feed/leaving"])
    expect(getConfirmedSubscriptionChange("failingList")).toBeUndefined()
  })

  test("refetching one view keeps the other views' subscriptions", async () => {
    seed([
      createSubscription("article", FeedViewType.Articles, null),
      createSubscription("dropped", FeedViewType.Articles, null),
      createSubscription("picture", FeedViewType.Pictures, null),
    ])
    useSubscriptionStore.setState({
      subscriptionIdSet: new Set(["feed/article", "feed/dropped", "feed/picture"]),
    })

    await subscriptionActions.upsertMany(
      [createSubscription("article", FeedViewType.Articles, null)],
      { resetBeforeUpsert: FeedViewType.Articles },
    )

    const state = useSubscriptionStore.getState()
    expect([...state.subscriptionIdSet].sort()).toEqual(["feed/article", "feed/picture"])
    expect(Object.keys(state.data).sort()).toEqual(["article", "picture"])
    expect([...state.feedIdByView[FeedViewType.All]].sort()).toEqual(["article", "picture"])
  })
})

describe("getSortedGroupedSubscriptionSelector", () => {
  test("sorts folders by the unread total of their feeds and hides read ones", () => {
    useUnreadStore.setState({ data: { a: 1, b: 1, c: 5, d: 0 } })
    const grouped = { Two: ["a", "b"], Five: ["c"], Read: ["d"] }
    const select = getSortedGroupedSubscriptionSelector(useSubscriptionStore.getState())

    expect(
      select({
        view: FeedViewType.Articles,
        grouped,
        sortBy: "count",
        sortOrder: "desc",
        hideAllReadSubscriptions: true,
      }).map((group) => group.category),
    ).toEqual(["Five", "Two"])
  })
})
