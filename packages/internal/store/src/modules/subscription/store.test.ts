import { FeedViewType } from "@follow/constants"
import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { apiContext, queryClientContext } from "../../context"
import type { SyncEngineHandle } from "../../sync/sync-status"
import { registerSyncEngine } from "../../sync/sync-status"
import type { FollowAPI } from "../../types"
import { getFeedByIdOrUrl } from "../feed/getter"
import { feedSyncServices, useFeedStore } from "../feed/store"
import type { FeedModel } from "../feed/types"
import { useListStore } from "../list/store"
import type { ListModel } from "../list/types"
import { useUnreadStore } from "../unread/store"
import { getSortedGroupedSubscriptionSelector, getSubscriptionByFeedId } from "./getter"
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
  create: vi.fn(),
}))

vi.mock("i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("i18next")>()),
  t: (key: string) => key,
}))

vi.mock("@follow/database/services/feed", () => ({
  FEED_EXTRA_DATA_KEYS: [],
  FeedService: {
    upsertMany: vi.fn(async () => {}),
  },
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
        create: mocks.create,
        delete: mocks.deleteSubscriptions,
        update: mocks.update,
      },
      categories: { update: mocks.updateCategory, delete: mocks.deleteCategory },
    } as unknown as FollowAPI)
  })

  test("skips a subscription in a view the app has no list for, keeping the others", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    seed([])

    subscriptionActions.upsertManyInSession([
      createSubscription("a", FeedViewType.Articles, "Tech"),
      createSubscription("broken", 99 as FeedViewType, "Tech"),
      createSubscription("b", FeedViewType.Pictures, null),
    ])

    const state = useSubscriptionStore.getState()
    expect(Object.keys(state.data).sort()).toEqual(["a", "b"])
    expect([...state.feedIdByView[FeedViewType.All]].sort()).toEqual(["a", "b"])

    // A change to such a view keeps the subscription where it is
    subscriptionActions.patchInSession("a", { view: 99 as FeedViewType, title: "Renamed" })
    expect(useSubscriptionStore.getState().data.a).toMatchObject({
      view: FeedViewType.Articles,
      title: "Renamed",
    })
    expect(useSubscriptionStore.getState().feedIdByView[FeedViewType.Articles].has("a")).toBe(true)
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
      from: "Tech",
      to: "Science",
      view: FeedViewType.All,
    })
  })

  test("names the feeds of an auto-grouped folder, which have no category on the server", async () => {
    useFeedStore.setState({
      feeds: {
        a: {
          type: "feed",
          id: "a",
          url: "https://example.com/a.xml",
          siteUrl: "https://example.com",
        },
        b: {
          type: "feed",
          id: "b",
          url: "https://example.com/b.xml",
          siteUrl: "https://example.com",
        },
      } as unknown as Record<string, FeedModel>,
    })
    // "a" is in the folder by its site, "b" by name
    seed([
      createSubscription("a", FeedViewType.Articles, null),
      createSubscription("b", FeedViewType.Articles, "Example.com"),
    ])

    try {
      await subscriptionSyncService.renameCategory({
        lastCategory: "Example.com",
        newCategory: "Blogs",
        view: FeedViewType.Articles,
      })
    } finally {
      useFeedStore.setState({ feeds: {} })
    }

    expect(mocks.updateCategory).toHaveBeenCalledWith({ feedIdList: ["a", "b"], category: "Blogs" })
    const state = useSubscriptionStore.getState()
    expect(state.data.a!.category).toBe("Blogs")
    expect(state.data.b!.category).toBe("Blogs")
  })

  test("sends only the fields an edit changed, so another device's edit is kept", async () => {
    // The local copy still has the category another device just changed.
    seed([{ ...createSubscription("a", FeedViewType.Articles, "World"), title: null }])

    await subscriptionSyncService.edit({
      ...createSubscription("a", FeedViewType.Articles, "World"),
      title: "BBC W",
    })

    expect(mocks.update).toHaveBeenCalledTimes(1)
    expect(mocks.update).toHaveBeenCalledWith({ title: "BBC W", feedId: "a", listId: undefined })
    expect(useSubscriptionStore.getState().data.a).toMatchObject({
      title: "BBC W",
      category: "World",
    })
  })

  test("moves a feed to another category with only that field", async () => {
    seed([createSubscription("a", FeedViewType.Articles, "News")])

    await subscriptionSyncService.edit({
      ...createSubscription("a", FeedViewType.Articles, "News"),
      category: "Blogs",
    })

    expect(mocks.update).toHaveBeenCalledWith({ category: "Blogs", feedId: "a", listId: undefined })
    const state = useSubscriptionStore.getState()
    expect(state.data.a!.category).toBe("Blogs")
    expect(state.categories[FeedViewType.Articles].has("Blogs")).toBe(true)
  })

  test("sends nothing when a form only spells the same values differently", async () => {
    seed([createSubscription("a", FeedViewType.Articles, null)])

    await subscriptionSyncService.edit({
      ...createSubscription("a", FeedViewType.Articles, null),
      category: "",
      title: "",
      hideFromTimeline: undefined,
      isPrivate: false,
    })

    expect(mocks.update).not.toHaveBeenCalled()
    expect(useSubscriptionStore.getState().data.a!.category).toBeNull()
  })

  test("renames the feeds another device moved into the category since the last pull", async () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "CatB2"),
      createSubscription("b", FeedViewType.Articles, null),
    ])
    const catchUp = vi.fn(async () => {
      // The pull brings the other device's move of "b" into the category.
      subscriptionActions.patchInSession("b", { category: "CatB2" })
      return true
    })
    registerSyncEngine({ catchUp } as unknown as SyncEngineHandle)

    try {
      await subscriptionSyncService.renameCategory({
        lastCategory: "CatB2",
        newCategory: "CatB3",
        view: FeedViewType.Articles,
      })
    } finally {
      registerSyncEngine(null)
    }

    expect(catchUp).toHaveBeenCalledTimes(1)
    // By name, so the server also renames a feed moved in after the pull
    expect(mocks.updateCategory).toHaveBeenCalledWith({
      from: "CatB2",
      to: "CatB3",
      view: FeedViewType.Articles,
    })
    const state = useSubscriptionStore.getState()
    expect(state.data.b!.category).toBe("CatB3")
  })

  test("leaves out a feed another device took out of the category since the last pull", async () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "Tech"),
      createSubscription("c", FeedViewType.Articles, "Tech"),
    ])
    registerSyncEngine({
      catchUp: async () => {
        subscriptionActions.patchInSession("c", { category: "Other" })
        return true
      },
    } as unknown as SyncEngineHandle)

    try {
      await subscriptionSyncService.renameCategory({
        lastCategory: "Tech",
        newCategory: "Science",
        view: FeedViewType.Articles,
      })
    } finally {
      registerSyncEngine(null)
    }

    expect(mocks.updateCategory).toHaveBeenCalledWith({
      from: "Tech",
      to: "Science",
      view: FeedViewType.Articles,
    })
    const state = useSubscriptionStore.getState()
    expect(state.data.c!.category).toBe("Other")
    expect(mocks.patchMany).toHaveBeenCalledWith({
      feedIds: ["a"],
      data: { category: "Science" },
    })
  })

  test("renames at once and does not wait long for the pull on a slow network", async () => {
    vi.useFakeTimers()
    seed([createSubscription("a", FeedViewType.Articles, "Tech")])
    registerSyncEngine({
      catchUp: () => new Promise<boolean>(() => {}),
    } as unknown as SyncEngineHandle)

    try {
      const rename = subscriptionSyncService.renameCategory({
        lastCategory: "Tech",
        newCategory: "Science",
        view: FeedViewType.Articles,
      })
      await vi.advanceTimersByTimeAsync(0)
      expect(useSubscriptionStore.getState().data.a!.category).toBe("Science")
      expect(mocks.updateCategory).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(2000)
      await rename
    } finally {
      registerSyncEngine(null)
      vi.useRealTimers()
    }

    expect(mocks.updateCategory).toHaveBeenCalledWith({
      from: "Tech",
      to: "Science",
      view: FeedViewType.Articles,
    })
  })

  test("forgets a category renamed on another device once no feed uses it", () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "CatB4"),
      createSubscription("b", FeedViewType.Articles, "CatB4"),
      createSubscription("c", FeedViewType.Pictures, "CatB4"),
    ])

    // The change log delivers the rename as one category change per feed.
    subscriptionActions.patchInSession("a", { category: "CatB5" })
    let { categories } = useSubscriptionStore.getState()
    expect(categories[FeedViewType.Articles].has("CatB4")).toBe(true)

    subscriptionActions.patchInSession("b", { category: "CatB5" })
    categories = useSubscriptionStore.getState().categories
    expect([...categories[FeedViewType.Articles]]).toEqual(["CatB5"])
    // Another view still has a folder of that name.
    expect(categories[FeedViewType.Pictures].has("CatB4")).toBe(true)
    expect(categories[FeedViewType.All].has("CatB4")).toBe(true)

    subscriptionActions.patchInSession("c", { category: "CatB5" })
    categories = useSubscriptionStore.getState().categories
    expect(categories[FeedViewType.All].has("CatB4")).toBe(false)
  })

  test("forgets the category a feed left when it was moved to another one", async () => {
    seed([createSubscription("a", FeedViewType.Articles, "News")])

    await subscriptionSyncService.edit({
      ...createSubscription("a", FeedViewType.Articles, "News"),
      category: "Blogs",
    })

    expect([...useSubscriptionStore.getState().categories[FeedViewType.Articles]]).toEqual([
      "Blogs",
    ])
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

  test("unfollows the selected feeds and lists in one request", async () => {
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
      [{ feedIdList: ["feed1", "feed2"], listIdList: ["list1", "list2"] }],
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
    // The unfollows stay confirmed until the change log reaches the request's sync id
    expect(getConfirmedSubscriptionChange("feed2")).toEqual({ subscription: null, syncId: 41 })
    expect(getConfirmedSubscriptionChange("list1")).toEqual({ subscription: null, syncId: 41 })
    expect(getConfirmedSubscriptionChange("list2")).toEqual({ subscription: null, syncId: 41 })
  })

  test("puts the selection back when its unfollow failed", async () => {
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
    // The server unfollows the feeds and lists of one request together, or none of them
    mocks.deleteSubscriptions.mockRejectedValue(error)

    await expect(subscriptionSyncService.unsubscribe(["leaving", "failingList"])).rejects.toBe(
      error,
    )

    const state = useSubscriptionStore.getState()
    expect(Object.keys(state.data).sort()).toEqual(["failingList", "leaving"])
    expect(state.listIdByView[FeedViewType.Articles].has("failingList")).toBe(true)
    expect(state.feedIdByView[FeedViewType.Articles].has("leaving")).toBe(true)
    expect(mocks.deleteSubscriptionRows).not.toHaveBeenCalled()
    expect(getConfirmedSubscriptionChange("failingList")).toBeUndefined()
    expect(getConfirmedSubscriptionChange("leaving")).toBeUndefined()
  })

  test("follows a feed the server has not stored by its URL, not by its nonce id", async () => {
    const url = "rsshub://test/sort"
    useFeedStore.setState({
      feeds: {
        nonce: { type: "feed", id: "nonce", nonce: "nonce", url, title: "Sort" } as FeedModel,
      },
    })
    seed([])
    mocks.create.mockResolvedValue({
      code: 0,
      feed: { type: "feed", id: "feed-sort", url, title: "Sort" },
      list: null,
      unread: {},
    })

    await subscriptionSyncService.subscribe({
      url,
      feedId: "nonce",
      listId: undefined,
      view: FeedViewType.Articles,
      category: null,
      isPrivate: false,
      hideFromTimeline: null,
      title: null,
    })

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.create.mock.calls[0]![0]).toMatchObject({ url })
    expect(mocks.create.mock.calls[0]![0].feedId).toBeUndefined()
    // The followed feed takes the place of its preview
    expect(Object.keys(useFeedStore.getState().feeds)).toEqual(["feed-sort"])
    expect(useSubscriptionStore.getState().data["feed-sort"]?.feedId).toBe("feed-sort")
  })

  test("fails a follow the server answered without what it followed, storing nothing", async () => {
    const url = "https://example.com/new-feed.xml"
    seed([])
    mocks.create.mockResolvedValue({ code: 0, feed: null, list: null, unread: {} })

    await expect(
      subscriptionSyncService.subscribe({
        url,
        feedId: undefined,
        listId: undefined,
        view: FeedViewType.Articles,
        category: null,
        isPrivate: false,
        hideFromTimeline: null,
        title: null,
      }),
    ).rejects.toThrow("feed.follow_failed")

    expect(useSubscriptionStore.getState().data).toEqual({})
    expect(mocks.upsertSubscriptionRows).not.toHaveBeenCalled()
  })

  test("finds the subscription of a feed followed by its RSSHub instance address", async () => {
    const address = "http://localhost:1200/test/sort"
    const url = "rsshub://test/sort"
    useFeedStore.setState({ feeds: {}, resolvedUrls: {} })
    seed([])
    const getFeed = vi.fn(async () => ({
      data: { feed: { type: "feed", id: "", title: "", url } },
    }))
    apiContext.provide({
      feeds: { get: getFeed },
      subscriptions: { create: mocks.create },
    } as unknown as FollowAPI)
    mocks.create.mockResolvedValue({
      code: 0,
      feed: { type: "feed", id: "feed-sort", url, title: "Sort" },
      list: null,
      unread: {},
    })

    const { feed } = await feedSyncServices.fetchFeedByUrl({ url: address })
    await subscriptionSyncService.subscribe({
      url: feed.url,
      feedId: feed.id,
      listId: undefined,
      view: FeedViewType.Articles,
      category: null,
      isPrivate: false,
      hideFromTimeline: null,
      title: null,
    })

    // A search result for the typed address looks the feed up by that address
    const feedId = getFeedByIdOrUrl({ url: address })?.id
    expect(feedId).toBe("feed-sort")
    expect(getSubscriptionByFeedId(feedId)?.feedId).toBe("feed-sort")
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
