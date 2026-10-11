import { FeedViewType } from "@follow/constants"
import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { apiContext, queryClientContext } from "../../context"
import type { FollowAPI } from "../../types"
import { useListStore } from "../list/store"
import type { ListModel } from "../list/types"
import { useUnreadStore } from "../unread/store"
import { subscriptionSyncService, useSubscriptionStore } from "./store"
import type { SubscriptionModel } from "./types"

const mocks = vi.hoisted(() => ({
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
})
